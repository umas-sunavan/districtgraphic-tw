import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dashDate'
})
export class DashDatePipe implements PipeTransform {

  transform(value: string, ...args: unknown[]): string {
    const splitTime = value.split('-')
    return `${splitTime[1]}月${splitTime[2]}日${splitTime[3]}點${splitTime[4].slice(0,2)}分`
  }

}
