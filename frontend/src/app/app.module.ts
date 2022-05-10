import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TwitterService } from 'src/twitter.service';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';
import { NgxInputSearchModule } from 'ngx-input-search';
import { A11yModule } from '@angular/cdk/a11y';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatIconModule,
    NgxInputSearchModule,
    A11yModule,
    MatProgressSpinnerModule,
  ],
  providers: [TwitterService],
  bootstrap: [AppComponent],
})
export class AppModule {}
