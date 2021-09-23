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
      const isDarkness = imageData.data[pixel] < threshold ? true : false
      if (isDarkness) {
        imageData.data[pixel] = 0
        imageData.data[pixel + 1] = 0
        imageData.data[pixel + 2] = 0
      }
    }
    return imageData
  }
}
