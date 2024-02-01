import { UserV2 } from "twitter-api-v2";

export type TermsMap = { [id: string]: string[] };
export type ClosedOpenMap = { [id: string]: "open" | "closed" | "unknown" };
export type FindDomain = "followers" | "following" | "all";

export interface FindResult {
  statuses: ClosedOpenMap;
  terms: TermsMap;
  users: UserV2[];
}

export interface DomainResult {
  [id: string]: number;
}
