import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DataTexture, DoubleSide, Material, Mesh, MeshStandardMaterial, Plane, PlaneGeometry } from 'three';
import { ColorUtilService } from './color-util.service';
import { ImageProcessingService } from './image-processing.service';
import { WeatherService } from './weather.service';

@Injectable({
  providedIn: 'root'
})
export class CloudService {

  constructor(
    private httpclient: HttpClient,
    private weatherService: WeatherService,
    private imageProcess:ImageProcessingService,
    private colorUtil: ColorUtilService
    ) { }

  getCloudImage = () => {
    return this.httpclient.get<any>('https://us-central1-fluid-mote-320807.cloudfunctions.net/retriveCloudImage?type=realtime', 
    // @ts-ignore
    { headers: {}, responseType: 'arraybuffer' as ConstrainDOMStringParameters })
  }

  initCloudMesh = async () => {
    return new Promise<Mesh>(async resolve => {
      const next = await this.getCloudImage().toPromise()
      const int8Array = new Uint8ClampedArray(next)
      const base64String = btoa(String.fromCharCode(...int8Array))
      const img = new Image()
      const context = this.imageProcess.createCanvasContext()
      img.onload = () => {
        if (!context) throw new Error("No context found");
        context.drawImage(img, 0, 0)
        const cloudMaterial = this.setupCloudMaterial(context)
        const cloudGeo = this.setupCloudGeo()
        const cloudObj = new Mesh(cloudGeo, cloudMaterial)
        cloudObj.translateY(2)
        cloudObj.name = 'cloud'
        resolve(cloudObj)
      }
      img.src = 'data:image/jpeg;base64,' + base64String
    })
  }

  setupCloudMaterial = (context: CanvasRenderingContext2D): Material => {
    const imageData = context.getImageData(0, 0, 572, 572)
    const imageArray = imageData.data
    this.imageProcess.filterDarkness(imageData, 100)
    this.imageProcess.normalize(imageData, { bottom: 100 })
    let alphaImageArray = Uint8ClampedArray.from(imageArray)
    let heightImageArray = Uint8ClampedArray.from(imageArray)
    heightImageArray = this.imageProcess.shrinkImageData(imageData, 1).data
    const alphaTexture = new DataTexture(alphaImageArray, imageData.width, imageData.height)
    const heightTexture = new DataTexture(heightImageArray, imageData.width, imageData.height)
    const cloudMaterial = new MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      // map: alphaTexture,
      alphaMap: alphaTexture,
      displacementMap: heightTexture,
      displacementScale: -0.1,
      side: DoubleSide,
    })
    cloudMaterial.depthWrite = false
    return cloudMaterial
  }

  setupCloudGeo = (): PlaneGeometry => {
    const cloudGeo = new PlaneGeometry(17.4, 17.4, 572, 572)
    cloudGeo.rotateY(Math.PI)
    cloudGeo.rotateZ(Math.PI * 0.993)
    cloudGeo.rotateX(-Math.PI * 0.5)
    cloudGeo.translate(3.7, 0, 0.4)
    return cloudGeo
  }

}
