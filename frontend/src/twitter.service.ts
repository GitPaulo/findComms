import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, share, shareReplay } from "rxjs";
import { environment } from "./environments/environment";

export interface CommsData {
  users: any[];
  terms: { [id: string]: string };
  statuses: { [id: string]: "open" | "closed" | "unknown" };
}

export interface DomainData {
  followingCount: number;
  followerCount: number;
  domain: number;
}

export type FindDomain = "followers" | "following" | "all";

@Injectable({
  providedIn: "root",
})
export class TwitterService {
  constructor(private http: HttpClient) {}

  getDomain(userIdentifier: string): Observable<DomainData> {
    return this.http
      .get<DomainData>(`${environment.apiUrl}/api/domain`, {
        params: { userIdentifier },
      })
      .pipe(shareReplay());
  }

  getCommsUsers(
    userIdentifier: string,
    domain: FindDomain
  ): Observable<CommsData> {
    return this.http
      .get<CommsData>(`${environment.apiUrl}/api/find`, {
        params: { userIdentifier, domain },
      })
      .pipe(shareReplay());
  }
}
