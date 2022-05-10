import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, share } from "rxjs";
import { environment } from "./environments/environment";

export interface CommsData {
  users: any[];
  terms: { [id: string]: string };
  statuses: { [id: string]: "open" | "closed" | "unknown" };
}
export type FindDomain = "followers" | "following" | "all";

@Injectable({
  providedIn: "root",
})
export class TwitterService {
  constructor(private http: HttpClient) {}

  getCommsUsers(userId: string, domain: FindDomain): Observable<CommsData> {
    return this.http
      .get<CommsData>(`${environment.apiUrl}/api/find`, {
        params: { userIdentifier: userId, domain },
      })
      .pipe(share());
  }
}
