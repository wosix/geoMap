import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MapComponent } from './map/map.component';
import { HomeComponent } from './home/home.component';
import { ILITEAPI } from "geo/imapLiteApi-core.js";

@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    HomeComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ILITEAPI
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
