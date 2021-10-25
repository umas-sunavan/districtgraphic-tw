import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DataTexture, DoubleSide, Material, Mesh, MeshStandardMaterial, Object3D, Plane, PlaneGeometry } from 'three';
import { ColorUtilService } from './color-util.service';
import { ImageProcessingService } from './image-processing.service';
import { WeatherService } from './weather.service';
import gsap, { Power1 } from 'gsap';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class CloudService {

  constructor(
    private httpclient: HttpClient,
    private weatherService: WeatherService,
    private imageProcess: ImageProcessingService,
    private colorUtil: ColorUtilService
  ) { }

  getCloudImage = () => {
    if ( environment.useLocalRetriveCloud) {
      return this.httpclient.get<any>('https://us-central1-fluid-mote-320807.cloudfunctions.net/retriveCloudImage?type=realtime',
        // @ts-ignore
        { headers: {}, responseType: 'arraybuffer' as ConstrainDOMStringParameters })
    } else {
      return this.httpclient.get<any>('http://localhost:8081?type=realtime',
      // @ts-ignore
      { headers: {}, responseType: 'arraybuffer' as ConstrainDOMStringParameters })
    }
  }

  getCloudLastUpdate = (): Observable<{ cloudLastUpdate: string }> => {
    if ( environment.useLocalRetriveCloud) {
      return this.httpclient.get<any>('https://us-central1-fluid-mote-320807.cloudfunctions.net/retriveCloudImage?type=time')
    } else {
      return this.httpclient.get<any>('http://localhost:8081?type=time')
    }
  }

  initCloudMesh = async () => {
    return new Promise<Mesh>(async resolve => {
      const arrayBuffer = await this.getCloudImage().toPromise()
      const int8Array = new Uint8ClampedArray(arrayBuffer)
      let bindaryString = ''
      for (let i = 0; i < int8Array.length; i++) {
        bindaryString += String.fromCharCode(int8Array[i]);
      }
      const base64String = btoa(bindaryString)
      const img = new Image()
      const context = this.imageProcess.createCanvasContext()
      img.onload = () => {
        if (!context) throw new Error("No context found");
        context.drawImage(img, 0, 0)
        const cloudMaterial = this.setupCloudMaterial(context)
        const cloudGeo = this.setupCloudGeo(17.4, 17.4, 572, 572)
        const cloudObj = new Mesh(cloudGeo, cloudMaterial)
        cloudObj.name = 'cloud'
        resolve(cloudObj)
      }
      img.src = 'data:image/jpeg;base64,' + base64String
    })
  }

  initSkeletionCloudMmesh = () => {
    const cloudMaterial = new MeshStandardMaterial({ color: 0xffffff, transparent: true, wireframe: true, side: DoubleSide})
    const cloudGeo = this.setupCloudGeo(17.4, 17.4, 50, 50)
    const cloudObj = new Mesh(cloudGeo, cloudMaterial)
    this.animateSkeleton(cloudObj, cloudMaterial)
    return cloudObj
  }

  animateSkeleton = (object: Object3D, cloud:Material) => {
    const from = { opacity: 0.0 }
    gsap.to(
      from,
      {
        opacity: 0.4,
        onUpdate: () => {
          cloud.opacity = from.opacity
        },
      }
    ).play().yoyo(true).repeat(999)
  }

  setupCloudMaterial = (context: CanvasRenderingContext2D): Material => {
    const imageData = context.getImageData(0, 0, 572, 572)
    const imageArray = imageData.data
    this.imageProcess.levelAdjustment(imageData)
    // this.imageProcess.gammaCorrection(imageData,0.5)
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
      displacementScale: -0.4,
      side: DoubleSide,
      depthWrite: false
    })
    return cloudMaterial
  }

  setupCloudGeo = (width: number, height: number, widthSegments:number, heightSegments: number): PlaneGeometry => {
    const cloudGeo = new PlaneGeometry(width, height, widthSegments, heightSegments)
    cloudGeo.rotateY(Math.PI)
    cloudGeo.rotateZ(Math.PI * 0.993)
    cloudGeo.rotateX(-Math.PI * 0.5)
    cloudGeo.translate(3.7, 2, 0.4)
    return cloudGeo
  }

}
