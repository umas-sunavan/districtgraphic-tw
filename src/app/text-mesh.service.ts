import { Injectable } from '@angular/core';
import gsap, { Power1 } from 'gsap';
import { Font, FontLoader, Group, Mesh, MeshPhongMaterial, Object3D, PerspectiveCamera, Scene, TextGeometry } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ColorUtilService } from './color-util.service';
import { DistrictMeshData, MapInfoInFirebase, textMeshAndColor } from './interfaces';
import { MeshUtilService } from './mesh-util.service';
import { WeatherService } from './weather.service';

@Injectable({
  providedIn: 'root'
})
export class TextMeshService {

  constructor(
    private meshUtilService: MeshUtilService,
    private weatherService: WeatherService,
    private colorUtil: ColorUtilService
  ) {
    this.textsMeshAndColor = []
  }

  textsMeshAndColor: { textMesh: Mesh, districtMesh: Mesh, textHexColor: string }[]
  enableDimension: { height: boolean, tone: boolean } = { height: true, tone: true }

  paintMapTextFromMesh = (hoverMesh: Mesh) => {
    const textAboveMesh = this.textsMeshAndColor.filter(text => text.textMesh.name.includes(hoverMesh.name))
    if (textAboveMesh.length !== 0) {
      // @ts-ignore 
      textAboveMesh.forEach(foundText => foundText.textMesh.material.color = this.colorUtil.convertHexTo0to1(foundText.textHexColor))
    } else {
      // no text above the hovered mesh
    }
  }

  paintColorOnMapText = () => {
    this.textsMeshAndColor.forEach(({ textMesh, textHexColor: textColor }) => {
      // @ts-ignore
      textMesh.material.color = this.colorUtil.convertHexTo0to1(textColor)
    });
  }

  transparentTextMesh = () => {
    this.textsMeshAndColor.forEach(textMesh => this.meshUtilService.transparentMesh(textMesh.textMesh))
  }

  setupDimensionText = (mapInfo: MapInfoInFirebase) => {
    this.enableDimension.height = mapInfo.requireHeightDimension === "true" ? true : false
    this.enableDimension.tone = mapInfo.requireToneDimension === "true" ? true : false
  }

  setupAndAnimateTexts = (camera:PerspectiveCamera, orbitcontrols:OrbitControls, scene:Scene, taiwanMap:Object3D, meshesData:DistrictMeshData[]) => {
    const maxToneMesh = this.getExtremumMesh(taiwanMap, 'max', 'tone', meshesData);
    const minToneMesh = this.getExtremumMesh(taiwanMap, 'min', 'tone', meshesData);
    const maxHeightMesh = this.getExtremumMesh(taiwanMap, 'max', 'height', meshesData);
    const minHeightMesh = this.getExtremumMesh(taiwanMap, 'min', 'height', meshesData);

    const loader = new FontLoader()
    loader.load(this.weatherService.addBaseUrl('/assets/jf-openhuninn-1.1_Regular_districts_words.json'), ((font) => {
      if (this.textsMeshAndColor.length !== 0) {
        this.textsMeshAndColor.forEach(textMesh => textMesh.textMesh.removeFromParent())
        this.textsMeshAndColor = []
      }

      let maxHeightMeshGroup: Group
      // let minHeightMeshGroup: Group
      if (this.enableDimension.height) {
        const maxHeightTitleMesh = this.createTextMesh(font, maxHeightMesh.mesh3d, maxHeightMesh.zhDistrictName, maxHeightMesh.rgbColor)
        // const minHeightTitleMesh = this.createTextMesh(font, minHeightMesh.mesh3d, minHeightMesh.zhDistrictName, minHeightMesh.rgbColor)
        const maxHeightSubtitleMesh = this.createTextMesh(font, maxHeightMesh.mesh3d, `最高 ${Math.round(+maxHeightMesh.height * 10) / 10}`, maxHeightMesh.rgbColor)
        // const minHeightSubtitleMesh = this.createTextMesh(font, minHeightMesh.mesh3d, `最高降雨量 ${Math.round(+minHeightMesh.height * 10) / 10}mm`, minHeightMesh.rgbColor)
        scene.add(maxHeightTitleMesh)
        // scene.add(minHeightTitleMesh)
        scene.add(maxHeightSubtitleMesh)
        // scene.add(minHeightSubtitleMesh)
        maxHeightMeshGroup = this.createTextMeshGroup(maxHeightTitleMesh, maxHeightSubtitleMesh)
        scene.add(maxHeightMeshGroup)
        // minHeightMeshGroup = this.createTextMeshGroup(minHeightTitleMesh, minHeightSubtitleMesh)
        // scene.add(minHeightMeshGroup)
        this.animateText(maxHeightMeshGroup, maxHeightMesh, meshesData)
        // this.animateText(minHeightMeshGroup, minHeightMesh)

      }

      let maxToneMeshGroup: Group
      let minToneMeshGroup: Group
      if (this.enableDimension.tone) {
        const maxToneTitleMesh = this.createTextMesh(font, maxToneMesh.mesh3d, maxToneMesh.zhDistrictName, maxToneMesh.rgbColor)
        const minToneTitleMesh = this.createTextMesh(font, minToneMesh.mesh3d, minToneMesh.zhDistrictName, minToneMesh.rgbColor)
        const maxToneSubtitleMesh = this.createTextMesh(font, maxToneMesh.mesh3d, `最高 ${Math.round(+maxToneMesh.tone * 10) / 10}`, maxToneMesh.rgbColor)
        const minToneSubtitleMesh = this.createTextMesh(font, minToneMesh.mesh3d, `最低 ${Math.round(+minToneMesh.tone * 10) / 10}`, minToneMesh.rgbColor)
        scene.add(maxToneTitleMesh)
        scene.add(minToneTitleMesh)
        scene.add(maxToneSubtitleMesh)
        scene.add(minToneSubtitleMesh)
        maxToneMeshGroup = this.createTextMeshGroup(maxToneTitleMesh, maxToneSubtitleMesh)
        minToneMeshGroup = this.createTextMeshGroup(minToneTitleMesh, minToneSubtitleMesh)
        scene.add(maxToneMeshGroup)
        scene.add(minToneMeshGroup)
        this.animateText(maxToneMeshGroup, maxToneMesh, meshesData)
        this.animateText(minToneMeshGroup, minToneMesh, meshesData)
      }

      orbitcontrols.addEventListener('change', () => {
        if (maxToneMeshGroup) { maxToneMeshGroup.children.forEach(child => child.lookAt(camera.position)) }
        if (minToneMeshGroup) { minToneMeshGroup.children.forEach(child => child.lookAt(camera.position)) }
        if (maxHeightMeshGroup) { maxHeightMeshGroup.children.forEach(child => child.lookAt(camera.position)) }
      })
    }))
  }

  animateText = (fontMesh: Mesh | Group, meshData: DistrictMeshData, meshesData:DistrictMeshData[]) => {
    const [highestRainning, lowestRainning] = this.getHeightRange(meshesData)
    const normalizedScale = (+meshData.height - lowestRainning) / (highestRainning - lowestRainning);
    const from = { scaleY: 1 }
    const to = { scaleY: normalizedScale * 20 + 1 }
    gsap.to(from, {
      ...to,
      duration: 1.5,
      onUpdate: (() => {
        fontMesh.position.setY((from.scaleY / 9))
      }),
      ease: Power1.easeInOut
    }).delay(1).play()
  }

  getHeightRange = (meshData: DistrictMeshData[]) => {
    const sortByTemp = meshData.sort((a, b) => +a.height - +b.height)
    const maxHeight = +sortByTemp[sortByTemp.length - 1].height
    const minHeight = +sortByTemp[0].height
    return [maxHeight, minHeight]
  }

  getExtremumMesh = (source: Object3D, extremumType: string, dimension: string, meshesData: DistrictMeshData[]): DistrictMeshData => {
    let extremumToneMesh: Mesh | undefined
    let returnMeshData: DistrictMeshData | undefined
    if (dimension === 'tone') {
      const dataSortByDimension = meshesData.sort((a, b) => +b.tone - +a.tone)
      const extremumIndex = this.getArrayIndexBy(extremumType, dataSortByDimension)
      extremumToneMesh = this.meshUtilService.findMeshFromIndex(source, dataSortByDimension, extremumIndex)
      returnMeshData = dataSortByDimension[extremumIndex]
    } else if (dimension === 'height') {
      const dataSortByDimension = meshesData.sort((a, b) => +b.height - +a.height)
      const extremumIndex = this.getArrayIndexBy(extremumType, dataSortByDimension)
      extremumToneMesh = this.meshUtilService.findMeshFromIndex(source, dataSortByDimension, extremumIndex)
      returnMeshData = dataSortByDimension[extremumIndex]
    }
    if (returnMeshData) {
      return returnMeshData
    } else {
      throw new Error(`cannot get the ${dimension} mesh`);
    }
  }


  getArrayIndexBy = (extremumType: string, array: any[]): number => {
    let position
    if (extremumType === 'max') {
      position = 0
    } else if (extremumType === 'min') {
      position = array.length - 1
    }
    return position || 0
  }

  createTextMeshGroup = (title: Mesh, subtitle: Mesh): Group => {
    const group = new Group()
    subtitle.scale.set(0.6, 0.6, 0.6)
    subtitle.translateY(1.7)
    subtitle.name = subtitle.name + ' subtitle'
    title.translateY(1)
    title.name = title.name + ' subtitle'
    group.add(title).add(subtitle)
    return group
  }

  createTextMesh = (font: Font, districtMesh: Mesh, text: string, districtColor: { r: number, g: number, b: number }, options: { size: number, height: number } = { size: 0.3, height: 0 }): Mesh => {
    let fontMesh
    const geometry = new TextGeometry(text, {
      font: font,
      height: options.height,
      size: options.size,
      curveSegments: 1,
      bevelEnabled: false
    })

    const fontColor: string = this.colorUtil.blendHexColors('#' + this.colorUtil.convert0to1ToHex(districtColor), '#000000', 0.3)
    const material = new MeshPhongMaterial({ color: +('0x' + fontColor), transparent: true})
    fontMesh = new Mesh(geometry, material)
    fontMesh.position.set(districtMesh.position.x * 0.1, districtMesh.position.y * 0.1, districtMesh.position.z * 0.1)
    fontMesh.name = `${districtMesh.name} text`
    this.textsMeshAndColor.push({ textMesh: fontMesh, districtMesh: districtMesh, textHexColor: fontColor + '' })
    return fontMesh
  }
}
