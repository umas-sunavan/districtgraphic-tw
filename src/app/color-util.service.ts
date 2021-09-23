import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ColorUtilService {

  constructor() { }

  convert0to1ToHex = (color: { r: number, g: number, b: number } = { r: 0.4, g: 0.4, b: 0.4 }): string => {
    const rHex: string = Math.floor((color.r * 256)).toString(16)
    const gHex: string = Math.floor(color.g * 256).toString(16)
    const bHex: string = Math.floor(color.b * 256).toString(16)
    return rHex + gHex + bHex
  }

  convertHexTo0to1 = (hex: string) => {
    return {
      r: parseInt(hex.slice(0, 2), 16) / 255,
      g: parseInt(hex.slice(2, 4), 16) / 255,
      b: parseInt(hex.slice(4, 6), 16) / 255
    }
  }

  blendHexColors = (c0: string, c1: string, p: number) => {
    var f = parseInt(c0.slice(1), 16), t = parseInt(c1.slice(1), 16), R1 = f >> 16, G1 = f >> 8 & 0x00FF, B1 = f & 0x0000FF, R2 = t >> 16, G2 = t >> 8 & 0x00FF, B2 = t & 0x0000FF;
    return "" + (0x1000000 + (Math.round((R2 - R1) * p) + R1) * 0x10000 + (Math.round((G2 - G1) * p) + G1) * 0x100 + (Math.round((B2 - B1) * p) + B1)).toString(16).slice(1);
  }
}
