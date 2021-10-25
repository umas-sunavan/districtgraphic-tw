import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ImageProcessingService {

  constructor() { }

  createCanvasContext = (): CanvasRenderingContext2D => {
    const canvas = document.createElement("canvas")
    canvas.width = 572
    canvas.height = 572
    const context = canvas.getContext('2d')
    if (context) {
      return context
    } else {
      throw new Error("canvas context not created");
    }
  }

  normalize = (imageData: ImageData, from: { bottom: number }): ImageData => {
    for (let i = 0; i < imageData.data.length; i++) {
      const oldBandwith = 255 - from.bottom
      const enlargeRate = 255 / oldBandwith
      const newPixel = (imageData.data[i] - from.bottom) * enlargeRate
      const intNewPixel = Math.floor(newPixel)
      imageData.data[i] = intNewPixel
    }
    return imageData
  }

  levelAdjustment = (imageData: ImageData): ImageData => {

    const _darkLevelAdjustment = (sorted: Uint8ClampedArray, pixelCount: number) => {
      const darkSampleIndex = Math.floor(pixelCount * 0.25 * 0.99994)
      const darkSmapleValue = sorted[darkSampleIndex * 4]
      console.log('darkSmapleValue',darkSmapleValue);
      if (darkSmapleValue > 10) {
        const adjustor = 255 / (255 - darkSmapleValue)
        for (let color = 0; color < imageData.data.length; color++) {
          imageData.data[color] -= darkSmapleValue
          imageData.data[color] *= adjustor
        }
        
      } else {
        console.log('no level adjustment');
      }
    }

    const _brightLevelAdjustment = (sorted: Uint8ClampedArray, pixelCount: number) => {
      const brightSampleIndex = Math.floor(pixelCount * 0.25 * 0.00006)
      const brightSampleValue = sorted[brightSampleIndex * 4]
      console.log('brightSampleValue',brightSampleValue);
      if (brightSampleValue < 255 * 0.9) {
        const adjustor = 255 / brightSampleValue
        for (let color = 0; color < imageData.data.length; color++) {
          imageData.data[color] *= adjustor
          if (imageData.data[color] > 255) {
            imageData.data[color] = 255
          }
        }
      } else {
        console.log('no level adjustment');
      }
    }

    const sorted = new Uint8ClampedArray(imageData.data).filter((color, i) => i % 4 === 0).sort((a: number, b: number) => b - a)
    const pixelCount = sorted.length
    _brightLevelAdjustment(sorted, pixelCount)
    _darkLevelAdjustment(sorted, pixelCount)
    return imageData
  }


  gammaCorrection = (imageData: ImageData, gamma: number) => {
    const gammaCorrection = 1 / gamma
    for (let pixel = 0; pixel < imageData.data.length; pixel += 4) {
      const normalR = imageData.data[pixel] / 255
      const normalG = imageData.data[pixel + 1] / 255
      const normalB = imageData.data[pixel + 2] / 255
      const correctedNormalR = Math.pow(normalR, gammaCorrection)
      const correctedNormalG = Math.pow(normalG, gammaCorrection)
      const correctedNormalB = Math.pow(normalB, gammaCorrection)
      imageData.data[pixel] = correctedNormalR * 255
      imageData.data[pixel + 1] = correctedNormalG * 255
      imageData.data[pixel + 2] = correctedNormalB * 255
    }
    return imageData
  }

  shrinkImageData = (imageData: ImageData, shrinkPixels: number) => {
    const pixelsToShrink: number[] = []

    const _forEachPixel = (row: number, column: number) => {
      const pixelId = row * imageData.width + column
      const isCurren0 = imageData.data[pixelId * 4] <= 0
      const isUpper0 = imageData.data[(pixelId - imageData.width) * 4] <= 0
      const isBottom0 = imageData.data[(pixelId + imageData.width) * 4] <= 0
      const isLeft0 = imageData.data[(pixelId - 1) * 4] <= 0
      const isRight0 = imageData.data[(pixelId + 1) * 4] <= 0
      if (!isCurren0) {
        if (isBottom0 || isRight0 || isLeft0 || isUpper0) {
          pixelsToShrink.push(pixelId * 4 + 0, pixelId * 4 + 1, pixelId * 4 + 2)
        }
      }
    }

    const _lookUpPixels = (imageData: ImageData) => {
      for (let row = 0; row < imageData.height; row++) {
        for (let column = 0; column < imageData.width; column++) {
          _forEachPixel(row, column)
        }
      }
    }

    for (let shrinkCount = 0; shrinkCount < shrinkPixels; shrinkCount++) {
      _lookUpPixels(imageData)
      pixelsToShrink.forEach(pixel => imageData.data[pixel] = 0)
    }

    return imageData
  }

  filterDarkness = (imageData: ImageData, threshold: number): ImageData => {
    for (let pixel = 0; pixel < imageData.data.length; pixel += 4) {
      const r = imageData.data[pixel]
      const g = imageData.data[pixel + 1]
      const b = imageData.data[pixel + 2]
      const isDarkness = r < threshold && g < threshold && b < threshold
      if (isDarkness) {
        imageData.data[pixel] = 0
        imageData.data[pixel + 1] = 0
        imageData.data[pixel + 2] = 0
      }
    }
    return imageData
  }
}
