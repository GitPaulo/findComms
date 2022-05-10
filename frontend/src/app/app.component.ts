import { Component } from '@angular/core';
import { catchError, finalize, Observable, of } from 'rxjs';
import { TwitterService } from 'src/twitter.service';
import { CommsData } from '../twitter.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
})
export class AppComponent {
  title = 'findcomms';
  error = null;
  loading = false;
  results$: Observable<CommsData> = new Observable<CommsData>();

  constructor(private twitterService: TwitterService) {}

  ngOnInit(): void {}

  searchTrigger($event: Event): void {
    const stringEmitted = ($event.target as HTMLInputElement).value;

    this.error = null;
    this.loading = true;
    this.results$ = this.twitterService.getCommsUsers(stringEmitted).pipe(
      catchError((val) => {
        this.error = val.error;
        console.log(val);
        return of({ users: [], terms: {} });
      }),
      finalize(() => {
        this.loading = false;
        return of({ users: [], terms: {} });
      })
    );
  }

  getTerms(termMap: any, userId: string): string[] {
    return termMap[userId];
  }
}
