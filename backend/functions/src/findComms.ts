import { UserV2 } from "twitter-api-v2";
import termsMap from "./terms_map.json";
import {
  FindResult,
  ClosedOpenMap,
  TermsMap,
} from "../../../transfer/transfer-types";

// findComms
export function findComms(domainUsers: UserV2[]): FindResult {
  // TODO: more complex search
  // Filter users by comms in descriptions
  const openOrClosed: ClosedOpenMap = {};
  const foundTerms: TermsMap = {};
  domainUsers = domainUsers.filter((user: UserV2) => {
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

  return {
    statuses: openOrClosed,
    terms: foundTerms,
    users: domainUsers,
  };
}
