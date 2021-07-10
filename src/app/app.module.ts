import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GoogleSheetIntercepter, httpInterceptorProviders } from './googleSheetIntercepter';
import { GraphicComponent } from './graphic/graphic.component';

@NgModule({
  declarations: [
    AppComponent,
    GraphicComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [httpInterceptorProviders],
  bootstrap: [AppComponent]
})
export class AppModule { }
