import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "./environments/environment";

export interface CommsData {
  users: any[];
  terms: { [id: string]: string };
  statuses: { [id: string]: "open" | "closed" | "unknown" };
}

@Injectable({
  providedIn: "root",
})
export class TwitterService {
  constructor(private http: HttpClient) {}

  getCommsUsers(userId: string): Observable<CommsData> {
    return this.http.get<CommsData>(`${environment.apiUrl}/api/find`, {
      params: { userIdentifier: userId },
    });
  }
}
