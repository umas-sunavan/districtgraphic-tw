import { Injectable } from '@angular/core';
import {
    HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse, HttpErrorResponse
} from '@angular/common/http';
import { Observable, ObservableInput, of } from 'rxjs';
import mixpanel from 'mixpanel-browser'

@Injectable()
export class GoogleSheetIntercepter implements HttpInterceptor {

    intercept(req: HttpRequest<string>, next: HttpHandler):
        Observable<HttpEvent<any>> {
        return next.handle(req)
        .pipe(
            catchError((err: HttpErrorResponse):ObservableInput<any> => {
                console.log(err);
                if (err.status === 200 && (<string>err.error.text).includes(`/*O_o*/\ngoogle.visualization.Query.setResponse(`)) {
                    const passed = new HttpResponse({
                        body: JSON.parse(this.removeExtraText(err.error.text)),
                        headers: err.headers,
                        status: err.status,
                        statusText: err.statusText,
                        url: err.url || ''
                    })
                    return of(passed)
                }   else if (err.status == 0) {
                    mixpanel.track('internet_error', { message: err.message});
                    alert("網路異常。你的表單好像不是公開的？請到該表單點選「共用」->「取得連結」->設定成「知道連結的使用者」")
                }
                return of(err)
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