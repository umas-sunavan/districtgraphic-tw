import { Injectable } from '@angular/core';
import {
    HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse, HttpErrorResponse
} from '@angular/common/http';

import { Observable, ObservableInput, of } from 'rxjs';
@Injectable()
export class GoogleSheetIntercepter implements HttpInterceptor {

    intercept(req: HttpRequest<string>, next: HttpHandler):
        Observable<HttpEvent<any>> {
        return next.handle(req)
        .pipe(
            catchError((err: HttpErrorResponse):ObservableInput<any> => {
                console.log((<string>err.error.text).includes(`/*O_o*/\ngoogle.visualization.Query.setResponse(`));
                console.log(err.status);
                if (err.status === 200 && (<string>err.error.text).includes(`/*O_o*/\ngoogle.visualization.Query.setResponse(`)) {
                    const passed = new HttpResponse({
                        body: JSON.parse(this.removeExtraText(err.error.text)),
                        headers: err.headers,
                        status: err.status,
                        statusText: err.statusText,
                        url: err.url || ''
                    })
                    return of(passed)
                }   else {
                    return of(err)
                }
            })
        )
    }

    removeExtraText = (text:string) => {
        const tokenToReplaceOnStart = `/*O_o*/\ngoogle.visualization.Query.setResponse(`
        const tokenToReplaceOnend = `);`
        return text.replace(tokenToReplaceOnStart, '').replace(tokenToReplaceOnend, '')
    }
}

import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';

/** Http interceptor providers in outside-in order */
export const httpInterceptorProviders = [
    { provide: HTTP_INTERCEPTORS, useClass: GoogleSheetIntercepter, multi: true },
];