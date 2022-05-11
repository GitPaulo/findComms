import { Component, ElementRef, ViewChild } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatIconRegistry } from "@angular/material/icon";
import { DomSanitizer } from "@angular/platform-browser";
import { catchError, finalize, Observable, of, switchMap } from "rxjs";
import { DomainData, FindDomain, TwitterService } from "src/twitter.service";
import { CommsData } from "../twitter.service";
import { InfoDialogComponent } from "./info-dialog/info-dialog.component";
import { LargeRequestDialogComponent } from "./large-request-dialog/large-request-dialog.component";

const githubSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
</svg>`;

export interface LargeRequestDialogData {
  domain: number;
}

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.less"],
})
export class AppComponent {
  @ViewChild("searchInput")
  searchInput!: ElementRef;
  title = "findcomms";
  loading = false;
  results$: Observable<CommsData> = new Observable<CommsData>();
  error = "";

  constructor(
    private twitterService: TwitterService,
    iconRegistry: MatIconRegistry,
    sanitizer: DomSanitizer,
    private dialog: MatDialog
  ) {
    iconRegistry.addSvgIconLiteral(
      "github",
      sanitizer.bypassSecurityTrustHtml(githubSVG)
    );
  }

  ngOnInit(): void {}

  searchTrigger($event: Event): void {
    const stringEmitted = ($event.target as HTMLInputElement).value;
    // If your at is small, too bad
    if (stringEmitted.length < 3) return;
    const emptyData: CommsData = { users: [], terms: {}, statuses: {} };
    const splitIndex = stringEmitted.indexOf(":");

    let userIdentifier = stringEmitted;
    let domain: FindDomain = "all";
    if (splitIndex > 0) {
      userIdentifier = stringEmitted.substring(0, splitIndex);
      const domainString = stringEmitted.substring(splitIndex + 1) || "";
      switch (domainString) {
        case "followers":
          domain = "followers";
          break;
        case "following":
          domain = "following";
          break;
        default:
          domain = "all";
      }
      // highlight
      this.searchInput.nativeElement.setSelectionRange(
        splitIndex,
        stringEmitted.length
      );
    }

    this.error = "";
    this.loading = true;
    this.results$ = this.twitterService.getDomain(userIdentifier).pipe(
      switchMap((data: DomainData) => {
        // Large domain > 5000
        const domainSize = data[domain];
        if (domainSize > 5000) {
          const dialogRef = this.dialog.open(LargeRequestDialogComponent, {
            data: {
              domain: domainSize,
            },
          });
          return dialogRef.afterClosed();
        }
        return this.twitterService.getCommsUsers(userIdentifier, domain);
      }),
      switchMap((result: any) => {
        if (result === "cancel") {
          throw new Error("Request cancelled by user.");
        }
        if (result === "continue") {
          return this.twitterService.getCommsUsers(userIdentifier, domain);
        }
        return of(result);
      }),
      catchError(({ error }: { error: string | any }) => {
        this.error =
          error instanceof ProgressEvent
            ? "API is likely down!"
            : error || error.message || "No clue what went wrong, retry lol?";
        return of(emptyData);
      }),
      finalize(() => {
        this.loading = false;
      })
    );
  }

  getTerms(termMap: any, userId: string): string[] {
    return termMap[userId];
  }

  getProfile(user: any): string {
    return user?.url || `https://twitter.com/${user?.username}`;
  }

  gotoTwitterProfile(user: any): void {
    window.open(this.getProfile(user), "_blank")?.focus();
  }

  openInfoDialog(): void {
    const dialogRef = this.dialog.open(InfoDialogComponent);
  }
}
