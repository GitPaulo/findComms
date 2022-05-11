import { MatButtonModule } from "@angular/material/button";
import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { TwitterService } from "src/twitter.service";
import { MatDialogModule } from "@angular/material/dialog";
import { AppComponent } from "./app.component";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MatIconModule } from "@angular/material/icon";
import { NgxInputSearchModule } from "ngx-input-search";
import { A11yModule } from "@angular/cdk/a11y";
import { InfoDialogComponent } from "./info-dialog/info-dialog.component";
import { MatTooltipModule } from "@angular/material/tooltip";
import { LargeRequestDialogComponent } from './large-request-dialog/large-request-dialog.component';

@NgModule({
  declarations: [AppComponent, InfoDialogComponent, LargeRequestDialogComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatIconModule,
    NgxInputSearchModule,
    A11yModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatDialogModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  providers: [TwitterService],
  bootstrap: [AppComponent],
})
export class AppModule {}
