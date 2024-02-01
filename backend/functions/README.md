> **This literally cant work rn because of elon: https://developer.twitter.com/en/portal/products/basic**

# findComms (back end)

Backend for findComms.

findComms is an application that searches an account's following for artists providing commissions/stores/etc on twitter.

## Local Dev

**Pre-req:**

- Firebase CLI: https://firebase.google.com/docs/cli#install-cli-mac-linux
- TS & Node (use nvm)

Setup `.env` file at `functions/` with twitter API creds `TWITTER_API_BEARER=`.

> More info: https://github.com/PLhery/node-twitter-api-v2/blob/39b021199d0331db11a60779b4bbe3f47dd53536/doc/auth.md#application-only-authentication-flow

```sh
  nvm use
  npm install
  npm run serve
```

Then do some `curl` requests to `http://127.0.0.1:5001/findcomms/us-central1/app` (example)

## TODO:

- redis instead of memcached
- auth endpoints?
- More terms_map
- More terms?
- What happens if i feed it elon musk? rate limit huh
