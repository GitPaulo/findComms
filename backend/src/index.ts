import { TwitterApi, UserV1, UserV2TimelineResult } from 'twitter-api-v2';
import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
// ? this wont scale
import memcache from 'memory-cache';
import path from 'path';

dotenv.config();

const twitterClient = new TwitterApi(String(process.env.TWITTER_API_BEARER));
const client = twitterClient.readWrite;
const app: Express = express();
const cache = new memcache.Cache();
const port = process.env.PORT;

// TODO: remove in production use nginx
app.use(express.static('../frontend/dist/findcomms'));

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: __dirname });
});

type FindDomain = 'followers' | 'following' | 'all';
app.get('/api/find', async (req: Request, res: Response) => {
  const userIdentifier = req.query.userIdentifier as string;
  const findDomain = (req.query.domain as FindDomain) || 'following';

  console.log('/followers userIdentifier', userIdentifier);

  if (!userIdentifier) {
    return res.status(400).send('Invalid user identifier.');
  }

  let domain: UserV2TimelineResult;
  let id: string;
  try {
    if (!isNaN(Number(userIdentifier.toString()))) {
      id = userIdentifier;
    } else {
      id = (await client.v2.userByUsername(userIdentifier)).data.id;
    }

    /*mock
    res.setHeader('Content-Type', 'application/json');
    res.sendFile(path.join(__dirname, './mock_data.json'));
    return;*/

    let cached = cache.get(`${id}_${findDomain}`);
    if (cached) {
      console.log('cached return!');
      res.setHeader('Content-Type', 'application/json');
      // maybe cache as string, but in mem tho?
      res.send(cached);
      return;
    }

    switch (findDomain) {
      case 'followers':
        domain = await client.v2.followers(id);
        break;
      case 'following':
        domain = await client.v2.following(id);
        break;
      case 'all':
        domain = {
          ...(await client.v2.following(id)),
          ...(await client.v2.followers(id)),
        };
        // TODO: remove duplicates? or it filters out by api?
        break;
      default:
        return res.status(400).send('Bad usage of domain!');
    }
  } catch (e: any) {
    console.log(e.stack);
    return res.status(500).send('Failed to resolve domain.');
  }

  if (!domain?.data?.length) {
    res.setHeader('Content-Type', 'application/json');
    return res.send(JSON.stringify([]));
  }

  let domainUsers: UserV1[];
  try {
    const followerIds = domain.data.map((followerData) => followerData.id);
    console.log(followerIds);
    domainUsers = await client.v1.users({ user_id: followerIds });
  } catch (e: any) {
    console.log(e.stack);
    return res.status(500).send('Failed to resolve follower user data.');
  }

  // filter users by comms in descriptions
  // TODO: more complex search
  let terms = ['store', 'commission', 'store'];
  let foundTerms: { [id: string]: string[] } = {};
  domainUsers = domainUsers.filter((user: UserV1) => {
    const term = terms.find(
      (term: string) =>
        user.name.toLowerCase().includes(term) ||
        user.description?.toLowerCase().includes(term)
    );

    if (term) {
      const entry = foundTerms[user.id];
      if (entry) {
        entry.push(term);
      } else {
        foundTerms[user.id] = [term];
      }
    }

    return Boolean(term);
  });

  const responseValue = JSON.stringify({
    terms: foundTerms,
    users: domainUsers,
  });
  console.log(foundTerms);

  // cache it, rate limits!!
  cache.put(`${id}_${findDomain}`, responseValue, 300000);

  res.setHeader('Content-Type', 'application/json');
  res.send(responseValue);
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});
