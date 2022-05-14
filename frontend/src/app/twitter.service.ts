import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, shareReplay } from "rxjs";
import { environment } from "../environments/environment";
import {
  DomainResult,
  FindResult,
  FindDomain,
} from "../../../transfer/transfer-types";

@Injectable({
  providedIn: "root",
})
export class TwitterService {
  constructor(private http: HttpClient) {}

  getDomain(userIdentifier: string): Observable<DomainResult> {
    return this.http
      .get<DomainResult>(`${environment.apiUrl}/api/domain`, {
        params: { userIdentifier },
      })
      .pipe(shareReplay());
  }

  getCommsUsers(
    userIdentifier: string,
    domain: FindDomain
  ): Observable<FindResult> {
    return this.http
      .get<FindResult>(`${environment.apiUrl}/api/find`, {
        params: { userIdentifier, domain },
      })
      .pipe(shareReplay());
  }
}
