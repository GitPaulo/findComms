import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CommsData {
  users: any[];
  terms: { [id: string]: string };
}

@Injectable({
  providedIn: 'root',
})
export class TwitterService {
  constructor(private http: HttpClient) {}

  getCommsUsers(userId: string): Observable<CommsData> {
    return this.http.get<CommsData>('/api/find', {
      params: { userIdentifier: userId },
    });
  }
}
