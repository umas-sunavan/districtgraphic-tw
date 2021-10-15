import { Injectable } from '@angular/core';
import mixpanel from 'mixpanel-browser'
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root'
})
export class MixpanelService {

  constructor() { }

  track = (title:string, value?: {[key: string]: string | undefined}) => {
    if (environment.production) {
      mixpanel.track(title, value)
    } else {
      console.log('Mock Track', title, value);
    }
  }

  init = () => {
    mixpanel.init('2364e64eb3aa323314fc7e5cc595dc73'); 
  }
}
