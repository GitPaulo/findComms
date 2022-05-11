import { TwitterApi, UserV1, UserV2 } from "twitter-api-v2";
import express, { Express, Request, Response } from "express";
import * as functions from "firebase-functions";
import dotenv from "dotenv";
import cors from "cors";
// import path from "path";
// ? this wont scale
import memcache from "memory-cache";
import termsMap from "./terms_map.json";

dotenv.config();

// Express
const app: Express = express();
// Twitter API
const twitterClient = new TwitterApi(String(process.env.TWITTER_API_BEARER));
const client = twitterClient.readWrite;
// Memory Cache
const index = new memcache.Cache();
const cache = new memcache.Cache();

app.use(cors());

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: __dirname });
});

app.get("/api/clearcaches", (req, res) => {
  console.log("/clearcaches");
  index.clear();
  cache.clear();
  console.log("All memory caches cleared.");
  return res.status(204);
});

type FindDomain = "followers" | "following" | "all";
app.get("/api/find", async (req: Request, res: Response) => {
  let userIdentifier = req.query.userIdentifier as string;
  // eslint-disable-next-line prefer-const
  let findDomain = (req.query.domain as FindDomain) || "all";

  // Log
  console.log("/followers userIdentifier", userIdentifier);

  if (!userIdentifier) {
    return res.status(400).send("Invalid user identifier.");
  }

  // Trim
  userIdentifier = userIdentifier.trim();

  // Resolve ID
  let id: string;
  try {
    const cachedId = index.get(userIdentifier) as string;
    if (cachedId) {
      console.log("Returned cached index");
      id = cachedId;
    } else {
      id = (await client.v2.userByUsername(userIdentifier))?.data?.id;
    }
    if (!id) throw Error("id resolved to nothing.");
    index.put(userIdentifier, id, 900000);
    console.log("Resolved ID: " + id);
  } catch (e: any) {
    console.log(e.stack);
    return res
      .status(400)
      .send(`Could not find user from '${userIdentifier}'.`);
  }

  // Resolve domain
  let domain: UserV2[] = [];
  try {
    /* ? mock
    res.setHeader('Content-Type', 'application/json');
    res.sendFile(path.join(__dirname, './mock_data.json'));
    return;
    */
    const cached = cache.get(`${id}_${findDomain}`);
    if (cached) {
      // Log
      console.log("Returned cached value.");

      res.setHeader("Content-Type", "application/json");
      res.send(cached);
      return;
    }

    switch (findDomain) {
      case "followers":
        domain = (await client.v2.followers(id, { max_results: 1000 }))?.data;
        break;
      case "following":
        domain = (await client.v2.following(id, { max_results: 1000 }))?.data;
        break;
      case "all":
        // API call removes duplicates
        domain = [
          ...((await client.v2.following(id, { max_results: 1000 }))?.data ||
            []),
          ...((await client.v2.followers(id, { max_results: 1000 }))?.data ||
            []),
        ];
        break;
      default:
        return res.status(400).send("Bad usage of domain!");
    }

    // If they have no followers/following
    if (!domain.length) {
      res.setHeader("Content-Type", "application/json");
      return res.send(JSON.stringify({ users: [], foundTerms: {} }));
    }
  } catch (e: any) {
    console.log(e.stack);
    if (e.response.code === 421) {
      console.log("Likely twitter API Rate limit reached!");
      return res.status(421).send("Rate limit reached?");
    }
    return res.status(500).send("Failed to resolve domain.");
  }

  // log size
  console.log("Domain size: ", domain.length);

  // Resolve domain users
  let domainUsers: UserV1[] = [];
  try {
    let followerIds = domain.map((user: UserV2) => user.id);
    followerIds = [...new Set(followerIds)];
    console.log("Trimmed size: ", followerIds.length);

    // API restriction
    // TODO use POST?
    const chunkSize = 100;
    for (let i = 0; i < followerIds.length; i += chunkSize) {
      const chunkIds = followerIds.slice(i, i + chunkSize);
      domainUsers = [
        ...domainUsers,
        ...(await client.v1.users({ user_id: chunkIds })),
      ];
    }
    console.log("Result size:", domainUsers.length);
  } catch (e: any) {
    console.log(e.stack);
    return res.status(500).send("Failed to resolve follower user data.");
  }

  // Filter users by comms in descriptions
  // TODO: more complex search
  const openOrClosed: { [id: string]: "open" | "closed" | "unknown" } = {};
  const foundTerms: { [id: string]: string[] } = {};
  domainUsers = domainUsers.filter((user: UserV1) => {
    for (const [keyTerm, terms] of Object.entries(termsMap)) {
      const searchSpace =
        user.name.toLowerCase() + user.description?.toLowerCase();
      // terms
      if (terms.some((term: string) => searchSpace.includes(term))) {
        foundTerms[user.id] = foundTerms[user.id]
          ? [...foundTerms[user.id], keyTerm]
          : [keyTerm];
      }
      // open/closed
      // TODO: improve
      const open = searchSpace.includes("open");
      const closed = searchSpace.includes("closed");
      if (open) {
        openOrClosed[user.id] = "open";
      } else if (closed) {
        openOrClosed[user.id] = "closed";
      }

      if (open && closed) {
        openOrClosed[user.id] = "unknown";
      }
    }

    return Boolean(foundTerms[user.id]?.length);
  });

  // Cache it, rate limits!!
  const responseValue = JSON.stringify({
    statuses: openOrClosed,
    terms: foundTerms,
    users: domainUsers,
  });
  cache.put(`${id}_${findDomain}`, responseValue, 60000);

  // Respond
  res.setHeader("Content-Type", "application/json");
  res.send(responseValue);
});

exports.app = functions.https.onRequest(app);
