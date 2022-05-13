/* eslint-disable no-fallthrough */
/* eslint-disable no-duplicate-case */
import { TwitterApi, UserV1, UserV2 } from "twitter-api-v2";
import express, { Express, Request, Response } from "express";
import * as functions from "firebase-functions";
import dotenv from "dotenv";
import cors from "cors";
// ? this wont scale
import memcache from "memory-cache";
import { findComms, FindResult } from "./findComms";

dotenv.config();

// Express
const app: Express = express();

// Twitter API
const twitterClient = new TwitterApi(String(process.env.TWITTER_API_BEARER));
const client = twitterClient.readWrite;

// Memory Cache
// ! does not scale homie
const index = new memcache.Cache<string, string>();
const indexTTL = 900000;
const cache = new memcache.Cache<string, FindResult>();
const cacheTTL = 60000;

// Log function
const log = (req: Request, ...args: unknown[]) => {
  console.log(`[${req.url}]`, ...args);
};

// Typings
type FindDomain = "followers" | "following" | "all";

// Uses
app.use(cors());

// Endpoints
app.get("/", (_, res: Response) => {
  res.sendFile("index.html", { root: __dirname });
});

app.get("/api/clearcaches", (req: Request, res: Response) => {
  log(req, "/clearcaches");
  index.clear();
  cache.clear();
  log(req, "All memory caches cleared.");
  return res.status(204);
});

app.get("/api/domain", async (req, res) => {
  let userIdentifier = req.query.userIdentifier as string;
  if (!userIdentifier) {
    return res.status(400).send("Invalid user identifier.");
  }

  // Log
  log(req, "/domain userIdentifier", userIdentifier);

  // Trim
  userIdentifier = userIdentifier.trim();

  // Resolve ID
  let user: UserV1;
  try {
    user = await client.v1.user({ screen_name: userIdentifier });
    const id = user?.id_str;
    if (!id) throw Error("id resolved to nothing.");
    // cache identifier -> id
    index.put(userIdentifier, id, indexTTL);
  } catch (e: any) {
    log(req, e.stack);
    return res.status(400).send(`User '${userIdentifier}' does not exist.`);
  }

  log(req, "User retrieved ", user.id);

  // Return domain size
  res.setHeader("Content-Type", "application/json");
  res.json({
    followers: Number(user?.followers_count),
    following: Number(user?.friends_count),
    all: Number(user?.followers_count) + Number(user?.friends_count),
  });
});

app.get("/api/find", async (req: Request, res: Response) => {
  let userIdentifier = req.query.userIdentifier as string;
  const findDomain = (req.query.domain as FindDomain) || "all";

  // Log
  log(req, "/find userIdentifier", userIdentifier);

  if (!userIdentifier) {
    return res.status(400).send("Invalid user identifier.");
  }
  userIdentifier = userIdentifier.trim();

  // Resolve ID
  let id: string;
  try {
    const cachedId = index.get(userIdentifier);
    if (cachedId) {
      log(req, "Returned cached index");
      id = cachedId;
    } else {
      const user = await client.v2.userByUsername(userIdentifier);
      id = user?.data?.id;
      if (!id) throw Error("id resolved to nothing.");
    }
    // cache identifier -> id
    index.put(userIdentifier, id, 900000);
  } catch (e: any) {
    log(req, e.stack);
    return res.status(400).send(`User '${userIdentifier}' does not exist.`);
  }

  // Log id
  log(req, "Resolved ID: " + id);

  // Resolve domain
  let domain: UserV2[] = [];
  try {
    const cached = cache.get(`${id}_${findDomain}`);
    if (cached) {
      log(req, "Returned cached value.");
      return res.json(cached);
    }

    const domainPaginators = [];
    switch (findDomain) {
      case "followers":
      case "all": {
        log(req, "followers");
        domainPaginators.push(
          await client.v2.followers(id, { asPaginator: true })
        );
      }
      case "following":
      case "all": {
        log(req, "following");
        domainPaginators.push(
          await client.v2.following(id, { asPaginator: true })
        );
        break;
      }
      default:
        return res.status(400).send("Bad usage of domain!");
    }

    for (const paginator of domainPaginators) {
      if (paginator.errors.length) {
        console.error(
          `Paginator had errors: ${paginator.errors
            .map((error) => error.detail)
            .join(", ")}`
        );
        console.log(paginator.errors);
        continue;
      }
      let i = 0;
      do {
        log(
          req,
          `Page: ${i++} [#${paginator?.data?.data?.length || 0}](done=${
            paginator.done
          })`
        );
        domain = [...domain, ...(paginator?.data?.data || [])]; // ugh
        await paginator.fetchNext();
      } while (!paginator.done);
    }

    // If they have no followers/following
    if (!domain.length) {
      return res.json({ users: [], foundTerms: {} });
    }
  } catch (e: any) {
    log(req, e.stack);
    if (e.data.status === 429) {
      log(req, "Likely twitter API Rate limit reached!");
      return res.status(500).send("Twitter rate limit reached!");
    }
    return res.status(500).send("Failed to resolve domain.");
  }

  // log size
  log(req, "Domain size: ", domain.length);

  // Resolve domain users
  let domainUsers: UserV2[] = [];
  try {
    let followerIds = domain.map((user: UserV2) => user.id);
    followerIds = [...new Set(followerIds)];
    log(req, "Trimmed size: ", followerIds.length);

    // Chunk user resolving
    // TODO use POST?
    const chunkSize = 100;
    log(req, "Resolving usernames chunkSize=" + chunkSize);
    for (let i = 0; i < followerIds.length; i += chunkSize) {
      log(req, `Chunk: ${i}`);
      const chunkIds = followerIds.slice(i, i + chunkSize);
      domainUsers = [...domainUsers, ...(await client.v2.users(chunkIds)).data];
    }
    log(req, "Result size:", domainUsers.length);
  } catch (e: any) {
    log(req, e.stack);
    // This time we have data
    if (e.data.status === 429) {
      log(
        req,
        "Twitter API limit reached cant continue. Sending data that I have..."
      );
      return res.status(500).json({
        message: "API rate limit reached! Not all of the domain was searched.",
        result: findComms(domainUsers),
      });
    }
    return res.status(500).send("Failed to resolve follower user data.");
  }

  // Cache it, rate limits!!
  const responseValue = findComms(domainUsers);
  cache.put(`${id}_${findDomain}`, responseValue, cacheTTL);

  // Respond
  res.json(responseValue);
});

exports.app = functions.https.onRequest(app);
