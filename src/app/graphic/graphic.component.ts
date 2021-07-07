import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Location as ngLocation } from '@angular/common';
import gsap, { Power1 } from 'gsap';
import { BackSide, BoxGeometry, CameraHelper, Color, CylinderGeometry, DirectionalLight, DirectionalLightHelper, Font, FontLoader, FrontSide, Group, HemisphereLight, HemisphereLightHelper, IcosahedronBufferGeometry, Intersection, IUniform, Light, LightShadow, Material, Mesh, MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial, MeshStandardMaterial, Object3D, PerspectiveCamera, PointLight, PointLightHelper, Raycaster, Scene, Shader, ShaderMaterial, SphereGeometry, SpotLight, SpotLightHelper, TextGeometry, Vector3, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { WeatherService } from '../weather.service';
import { DistrictWeatherInfo, EnZhMap } from '../interfaces';
@Component({
  selector: 'app-graphic',
  templateUrl: './graphic.component.html',
  styleUrls: ['./graphic.component.scss']
})
export class GraphicComponent implements OnInit, AfterViewInit {

  @ViewChild('canvas') canvas!: ElementRef<HTMLElement>
  scene: Scene
  camera: PerspectiveCamera
  renderer: WebGLRenderer
  light: PointLight
  directionalLight: DirectionalLight
  hemisphereLight: HemisphereLight
  spotlight: SpotLight
  raycaster: Raycaster
  mouse: { x: number, y: number }
  taiwanMap: Object3D
  whiteBorderMaterial: MeshBasicMaterial
  whiteBorder: Mesh
  sceneWeatherInfo: DistrictWeatherInfo[]
  transparentFlag: boolean
  orbitcontrols: OrbitControls
  textsMeshAndColor: { textMesh: Mesh, districtMesh: Mesh, textHexColor: string }[]
  intersactions: Intersection[] = []
  hoverDistrictWeatherInfo: DistrictWeatherInfo | undefined
  htmlTextColor: string = '#666666'
  htmlTextStatus: string = 'flex'
  box: Object3D
  box2: Object3D


  constructor(
    private weatherServer: WeatherService,
    private ngLocation: ngLocation
  ) {
    this.scene = new Scene()
    this.camera = new PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new WebGLRenderer()
    this.directionalLight = new DirectionalLight()
    this.hemisphereLight = new HemisphereLight()
    this.spotlight = new SpotLight()
    this.raycaster = new Raycaster()
    this.mouse = { x: 0, y: 0 }
    this.taiwanMap = new Object3D()
    this.whiteBorderMaterial = new MeshLambertMaterial({ color: 0xffffff, side: FrontSide, opacity: 0.7, transparent: true })
    this.whiteBorder = new Mesh()
    this.sceneWeatherInfo = []
    this.textsMeshAndColor = []
    this.transparentFlag = false
    this.orbitcontrols = new OrbitControls(this.camera, this.renderer.domElement)

    this.box = new Mesh()
    this.box2 = new Mesh()
    this.light = new PointLight()
  }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    this.setupRenderer()
    this.setupCamera()
    this.setupScene()
    this.setupLight()
    // this.setupBox()
    this.setupMap()
  }

  transparentMesh = (mesh: Mesh) => {
    if (mesh.isMesh) {
      const currentMaterial: Material = (<Material>mesh.material)
      // @ts-ignore
      currentMaterial.color = { r: 1, g: 1, b: 1 };
      currentMaterial.opacity = 0.6
    }
  }

  paintMeshFrom = (array: DistrictWeatherInfo[], meshToPaint: Mesh, paintNotFoundMesh?: { r: number, g: number, b: number }) => {
    const weatherInfo = this.findWeatherInfoFromMeshName(array, meshToPaint)
    if (weatherInfo) {
      if (weatherInfo.color) {
        // @ts-ignore
        meshToPaint.material.color = weatherInfo.color
      }
    } else {
      if (paintNotFoundMesh) {
        // @ts-ignore
        meshToPaint.material.color = paintNotFoundMesh
      }
    }
  }

  transparentAllMeshes = () => {
    this.scene.traverse(object3d => {
      this.transparentMesh((<Mesh>object3d))
    })
  }

  paintColorOnMesh = (paintBasedOn: DistrictWeatherInfo[], mesh: Mesh) => {
    this.paintMeshFrom(paintBasedOn, mesh);
    // @ts-ignore
    mesh.material.opacity = 1
  }

  updateMapText = (mesh: Mesh) => {
    const textAboveMesh = this.textsMeshAndColor.filter(text => text.textMesh.name.includes(mesh.name))
    if (textAboveMesh.length !== 0) {
      // @ts-ignore 
      textAboveMesh.forEach(foundText => foundText.textMesh.material.color = this.convertHexTo0to1(foundText.textHexColor))
    }
  }

  hasIntersection = () => this.intersactions.length > 0

  restoreMeshColor = (mesh: Mesh) => {
    if (mesh.isMesh) {
      this.paintMeshFrom(this.sceneWeatherInfo, mesh, { r: 1, g: 1, b: 1 });
      // @ts-ignore
      mesh.material.opacity = 1
    }
  }

  paintColorOntext = () => {
    this.textsMeshAndColor.forEach(({ textMesh, textHexColor: textColor }) => {
      // @ts-ignore
      textMesh.material.color = this.convertHexTo0to1(textColor)
    });
  }

  onMousemove = (event: MouseEvent) => {
    return 
    event.preventDefault()
    this.mouse = this.updateMousePosiion(event)
    this.raycaster.setFromCamera(this.mouse, this.camera)
    if (this.taiwanMap.children[0]) {
      this.intersactions = this.raycaster.intersectObjects(this.taiwanMap.children[0].children, true)
      if (this.intersactions.length > 0) {
        this.transparentFlag = true
        this.transparentAllMeshes()
        this.intersactions.forEach(intersection => {
          const hoverMesh = <Mesh>intersection.object
          this.paintColorOnMesh(this.sceneWeatherInfo, hoverMesh)
          const districtColor = this.findWeatherInfoFromMeshName(this.sceneWeatherInfo, hoverMesh)?.color
          // if got color data then paint text
          if (districtColor) {
            this.htmlTextColor = '#' + this.convert0to1ToHex(districtColor || { r: 0.4, g: 0.4, b: 0.4 });
            this.htmlTextStatus = 'show'
          } else {
            this.htmlTextStatus = 'none' // means the mesh has no data to show
          }
          this.updateMapText(hoverMesh)
        })
      } else if (this.transparentFlag) {
        this.taiwanMap.children[0].traverse(object3d => {
          this.restoreMeshColor(<Mesh>object3d)
        })
        this.paintColorOntext()
        this.htmlTextStatus = 'select'
        this.transparentFlag = false
      }
      this.intersactions.find(intersection => {
        if ((<Mesh>intersection.object).isMesh) {
          this.hoverDistrictWeatherInfo = this.findWeatherInfoFromMeshName(this.sceneWeatherInfo, (<Mesh>intersection.object))
        }
      })
    }
  }

  updateMousePosiion = (event: MouseEvent): { x: number, y: number } => {
    const mouseXFromDivLeft = event.offsetX
    const mouseYFromDivTop = event.offsetY
    const mouseXInCanvas0to1 = mouseXFromDivLeft / this.canvas.nativeElement.offsetWidth
    const mouseYInCanvas0to1 = mouseYFromDivTop / this.canvas.nativeElement.offsetHeight
    const mouseXInCanvasMinor1to1 = (mouseXInCanvas0to1 * 2) - 1
    const mouseYInCanvasMinor1to1 = -(mouseYInCanvas0to1 * 2) + 1
    return { x: mouseXInCanvasMinor1to1, y: mouseYInCanvasMinor1to1 }
  }

  setupRenderer = () => {
    this.renderer.shadowMap.enabled = true;
    this.renderer.setSize(this.canvas.nativeElement.offsetWidth, this.canvas.nativeElement.offsetHeight);
    this.canvas.nativeElement.appendChild(this.renderer.domElement);
    this.animate()
  }

  setupCamera = () => {
    this.camera.aspect = this.canvas.nativeElement.offsetWidth / this.canvas.nativeElement.offsetHeight
    this.camera.position.set(5, 16, 1);
    this.camera.lookAt(4, 0, 0);
    // this.animateCamera()
  }

  animateCamera = () => {
    const from = { px: 5, py: 16, pz: 1, lx: 4, ly: 0, lz: 0 }
    const to = { px: 3, py: 9, pz: 8, lx: 2, ly: -3, lz: 0 }
    gsap.to(from, {
      ...to,
      duration: 1.5,
      ease: Power1.easeInOut,
      onUpdate: (() => {
        this.camera.position.set(from.px, from.py, from.pz);
        this.camera.lookAt(from.lx, from.ly, from.lz)
      })
    }).delay(1.5).play()
  }

  setupBox = () => {
    const boxGeo = new BoxGeometry(2, 2, 2);
    const boxMaterial = new MeshLambertMaterial({ color: 0xffffff, opacity: 0.8, transparent: true })
    this.box = new Mesh(boxGeo, boxMaterial)
    this.box.traverse(object3d => {
      if ((<Mesh>object3d).isMesh) {
        //@ts-ignore
        (<Mesh>object3d).castShadow = true;
        (<Mesh>object3d).receiveShadow = true;
      }
    })
    this.box2 = new Mesh(boxGeo, boxMaterial)
    this.box2.traverse(object3d => {
      if ((<Mesh>object3d).isMesh) {
        //@ts-ignore
        (<Mesh>object3d).receiveShadow = true;
      }
    })
    this.box2.position.set(1, -2, 1)
    this.scene.add(this.box2)
    this.scene.add(this.box)
  }

  setupScene = () => {
    this.scene.background = new Color(0xeeeeee)
  }

  setupShadowTexture = (light: DirectionalLight) => {
    light.shadow.camera.near = 8;
    light.shadow.camera.far = 18;
    light.shadow.camera.left = -8;
    light.shadow.camera.right = 6;
    light.shadow.camera.top = 6;
    light.shadow.camera.bottom = 0;
    light.shadow.mapSize.width = this.renderer.capabilities.maxTextureSize
    light.shadow.mapSize.height = this.renderer.capabilities.maxTextureSize
  }

  setupLight = () => {
    this.hemisphereLight.intensity = 0.8
    this.hemisphereLight.color = new Color(0xffffff)
    this.scene.add(this.hemisphereLight)

    this.setupShadowTexture(this.directionalLight)

    this.directionalLight.intensity = 0.4
    this.directionalLight.color = new Color(0xffffff)
    this.directionalLight.position.set(-7, 7, -5)
    this.directionalLight.castShadow = true
    this.scene.add(this.directionalLight)
    // this.scene.add(new CameraHelper(this.directionalLight.shadow.camera));
  }

  appendEnglishNames = (districts: DistrictWeatherInfo[]) => {
    const appendedDistricts = districts.map(district => {
      const districtMap = this.weatherServer.districtsEnZhMap.find((map: EnZhMap) => {
        const sameDistrictName = map.zhDistrict === district.district
        const sameCityName = map.zhCity === district.city
        return sameDistrictName && sameCityName
      })
      if (districtMap) {
        district.enCity = districtMap.enCity
        district.enDistrictAndCity = `${districtMap.enDistrict}_${districtMap.enCity}`
      } else {
        district.enCity = 'No English Name Found'
        district.enDistrictAndCity = 'No English Name Found'
        throw new Error("No English Name");
      }
      return district
    })
    return appendedDistricts
  }

  blendHexColors = (c0: string, c1: string, p: number) => {
    var f = parseInt(c0.slice(1), 16), t = parseInt(c1.slice(1), 16), R1 = f >> 16, G1 = f >> 8 & 0x00FF, B1 = f & 0x0000FF, R2 = t >> 16, G2 = t >> 8 & 0x00FF, B2 = t & 0x0000FF;
    return "" + (0x1000000 + (Math.round((R2 - R1) * p) + R1) * 0x10000 + (Math.round((G2 - G1) * p) + G1) * 0x100 + (Math.round((B2 - B1) * p) + B1)).toString(16).slice(1);
  }

  getTempRange = (WeatherInDistricts: DistrictWeatherInfo[]) => {
    const sortByTemp = WeatherInDistricts.sort((a, b) => +a.topTempValue - +b.topTempValue)
    const highestTemp = +sortByTemp[sortByTemp.length - 1].topTempValue
    const lowestTemp = +sortByTemp[0].topTempValue
    return [highestTemp, lowestTemp]
  }

  getRainningRange = (WeatherInDistricts: DistrictWeatherInfo[]) => {
    const sortByTemp = WeatherInDistricts.sort((a, b) => +a.rainValue - +b.rainValue)
    const highestTemp = +sortByTemp[sortByTemp.length - 1].rainValue
    const lowestTemp = +sortByTemp[0].rainValue
    return [highestTemp, lowestTemp]
  }

  findWeatherInfoFromMeshName = (weatherInDistricts: DistrictWeatherInfo[], mesh: Mesh) => {
    return weatherInDistricts.find(weatherInDistrict => {
      const sameDistrictName = weatherInDistrict.enDistrictAndCity === mesh.name
      return sameDistrictName
    })
  }

  getMaterialColorByRate = (highestTemp: number, lowestTemp: number, currentTemp: number): { r: number, g: number, b: number, } => {
    const colorRate = (currentTemp - highestTemp) / (lowestTemp - highestTemp)
    const hashColor = this.blendHexColors('#EEF588', '#70B7F3', colorRate)
    return this.convertHexTo0to1(hashColor)
  }

  animateDistrictsHeight = (buffer: { mesh: Mesh, weatherInfo: DistrictWeatherInfo | undefined }[]) => {
    const weatherInfo: DistrictWeatherInfo[] = <DistrictWeatherInfo[]>buffer.filter(each => each.weatherInfo !== undefined).map(each => each.weatherInfo)
    const [highestRainning, lowestRainning] = this.getRainningRange(weatherInfo)
    const districtMeshAnimations:any[] = []
    for (let i = 0; i < buffer.length; i++) {
      if (buffer[i].weatherInfo) {
        const rainValue = buffer[i].weatherInfo?.rainValue || '0'
        const from = { scaleY: 1 }
        const normalizedScale = (+rainValue - lowestRainning) / (highestRainning - lowestRainning);
        const to = { scaleY: normalizedScale * 20 + 1 }
        const districtMeshAnimation =
          gsap.to(
            from, {
            ...to,
            duration: 1,
            onStart: (() => {
              if (+rainValue !== 0) {
                buffer[i].mesh.castShadow = true
              }
            }),
            onUpdate: (() => {
              buffer[i].mesh.scale.setY(from.scaleY)
              buffer[i].mesh.position.setY(from.scaleY / 2)
              this.textsMeshAndColor[0].districtMesh.position.setY(from.scaleY / 2)
            }),
            ease: Power1.easeInOut
          }
          ).delay(1).play()
        districtMeshAnimations.push(districtMeshAnimation)
      }
    }
  }

  setupMap = () => {
    const loader = new GLTFLoader()
    loader.loadAsync(this.ngLocation.prepareExternalUrl('/assets/taiwam15.gltf')).then(gltf => {
      gltf.scene.scale.set(0.1, 0.1, 0.1)
      this.weatherServer.getWeatherInfo().subscribe(districtsWeatherInfo => {
        const districtsAnimationBuffer: { mesh: Mesh, weatherInfo: DistrictWeatherInfo | undefined }[] = []
        this.setupMapMesh(gltf.scene, districtsWeatherInfo, districtsAnimationBuffer)
        // this.setupAndAnimateTexts(districtsAnimationBuffer)
        // this.animateDistrictsHeight(districtsAnimationBuffer)
      });
      this.scene.add(gltf.scene)
    })
  }

  setupMapMesh = (scene: Group, districtsWeatherInfoWithoutEnglish: DistrictWeatherInfo[], districtsAnimationBuffer: { mesh: Mesh, weatherInfo: DistrictWeatherInfo | undefined }[]) => {
    const mapMaterial = new MeshPhongMaterial({ opacity: 1.0, transparent: true })
    const distrcitsWeatherInfo = this.appendEnglishNames(districtsWeatherInfoWithoutEnglish)
    const [highestTemp, lowestTemp] = this.getTempRange(distrcitsWeatherInfo)
    this.taiwanMap = scene;
    scene.traverse(object3d => {
      const mesh: Mesh = (<Mesh>object3d)
      if (mesh.isMesh) {
        mesh.material = mapMaterial.clone();
        mesh.receiveShadow = true
        const meshWeatherInfo = this.findWeatherInfoFromMeshName(distrcitsWeatherInfo, mesh)
        if (meshWeatherInfo) {
          // meshWeatherInfo.rainValue = Math.random() < 0.2 ? Math.floor(Math.random() * Math.random() * Math.random() * 10) + '' : '0'
          meshWeatherInfo.color = this.getMaterialColorByRate(highestTemp, lowestTemp, +meshWeatherInfo.topTempValue);
          // @ts-ignore
          mesh.material.color = meshWeatherInfo.color
          this.sceneWeatherInfo.push(meshWeatherInfo)
        } else {
          // @ts-ignore
          mesh.material.color = { r: 1, g: 1, b: 1 }
        }
        districtsAnimationBuffer.push({ mesh: mesh, weatherInfo: meshWeatherInfo })
      }
    });
  }

  setupAndAnimateTexts = (buffer: { mesh: Mesh, weatherInfo: DistrictWeatherInfo | undefined }[]) => {
    const [hTDistrictMesh, hTWeatherInfo] = this.getSpecialMeshAndWeatherInfo('highest', 'temperature', this.sceneWeatherInfo)
    const [lTDistricempMesh, lTWeatherInfo] = this.getSpecialMeshAndWeatherInfo('lowest', 'temperature', this.sceneWeatherInfo)
    const [hRDistrictMesh, hRWeatherInfo] = this.getSpecialMeshAndWeatherInfo('highest', 'rainning', this.sceneWeatherInfo)
    const weatherInfo: DistrictWeatherInfo[] = <DistrictWeatherInfo[]>buffer.filter(each => each.weatherInfo !== undefined).map(each => each.weatherInfo)

    const loader = new FontLoader()
    loader.load(this.ngLocation.prepareExternalUrl('/assets/jf-openhuninn-1.1_Regular_districts_words.json'), ((font) => {
      const hTFontMeshTitle = this.createTextMesh(font, hTDistrictMesh, hTWeatherInfo.district, hTWeatherInfo.color)
      const lTFontMeshTitle = this.createTextMesh(font, lTDistricempMesh, lTWeatherInfo.district, lTWeatherInfo.color)
      const hRFontMeshTitle = this.createTextMesh(font, hRDistrictMesh, hRWeatherInfo.district, hRWeatherInfo.color)
      const hTFontMeshSubtitle = this.createTextMesh(font, hTDistrictMesh, `最高溫 ${Math.round(+hTWeatherInfo.topTempValue * 10) / 10}度`, hTWeatherInfo.color)
      const lTFontMeshSubtitle = this.createTextMesh(font, lTDistricempMesh, `最低溫 ${Math.round(+lTWeatherInfo.topTempValue * 10) / 10}度`, lTWeatherInfo.color)
      const hRFontMeshSubtitle = this.createTextMesh(font, hRDistrictMesh, `最高降雨量 ${Math.round(+hRWeatherInfo.topTempValue * 10) / 10}ml`, hRWeatherInfo.color)
      const hTFontMeshGroup = this.createTextMeshGroup(hTFontMeshTitle, hTFontMeshSubtitle)
      const lTFontMeshGroup = this.createTextMeshGroup(lTFontMeshTitle, lTFontMeshSubtitle)
      const hRFontMeshGroup = this.createTextMeshGroup(hRFontMeshTitle, hRFontMeshSubtitle)
      this.animateText(hTFontMeshGroup, hTWeatherInfo, weatherInfo)
      this.animateText(lTFontMeshGroup, lTWeatherInfo, weatherInfo)
      this.animateText(hRFontMeshGroup, hRWeatherInfo, weatherInfo)
      this.orbitcontrols.addEventListener('change', () => {
        [...hTFontMeshGroup.children, ...lTFontMeshGroup.children, ...hRFontMeshGroup.children].forEach(mesh => {
          mesh.lookAt(this.camera.position)
        })
      })
    }))
  }

  animateText = (fontMesh: Mesh | Group, weatherInfo: DistrictWeatherInfo, weatherInfos: DistrictWeatherInfo[]) => {
    const [highestRainning, lowestRainning] = this.getRainningRange(weatherInfos)
    const from = { scaleY: 1 }
    const normalizedScale = (+weatherInfo.rainValue - lowestRainning) / (highestRainning - lowestRainning);
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

  createTextMeshGroup = (title: Mesh, subtitle: Mesh): Group => {
    const group = new Group()
    subtitle.scale.set(0.6, 0.6, 0.6)
    subtitle.translateY(1.7)
    subtitle.name = subtitle.name + ' subtitle'
    title.translateY(1)
    title.name = title.name + ' subtitle'
    group.add(title).add(subtitle)
    this.scene.add(group)
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

    const fontColor: string = this.blendHexColors('#' + this.convert0to1ToHex(districtColor), '#000000', 0.3)
    const material = new MeshPhongMaterial({ color: +('0x' + fontColor) })
    fontMesh = new Mesh(geometry, material)
    fontMesh.position.set(districtMesh.position.x * 0.1, districtMesh.position.y * 0.1, districtMesh.position.z * 0.1)
    fontMesh.name = `${districtMesh.name} text`

    this.textsMeshAndColor.push({ textMesh: fontMesh, districtMesh: districtMesh, textHexColor: fontColor + '' })
    this.scene.add(fontMesh)
    return fontMesh
  }

  convert0to1ToHex = (color: { r: number, g: number, b: number }): string => {
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

  getSpecialMeshAndWeatherInfo = (highOrLowest: string, dimension: string, sceneWeatherInfo: DistrictWeatherInfo[]): [mesh: Mesh, weatherInfo: DistrictWeatherInfo] => {
    let specitalMesh: Mesh | undefined = undefined
    let weatherInfo: DistrictWeatherInfo | undefined = undefined
    if (dimension === 'temperature') {
      const sortByDimension = sceneWeatherInfo.sort((a, b) => +b.topTempValue - +a.topTempValue)
      const index = this.getArrayIndexBy(highOrLowest, sortByDimension)
      specitalMesh = this.findMeshFromIndex(sortByDimension, index)
      weatherInfo = sortByDimension[index]
    } else if (dimension === 'rainning') {
      const sortByDimension = sceneWeatherInfo.sort((a, b) => +b.rainValue - +a.rainValue)
      const index = this.getArrayIndexBy(highOrLowest, sortByDimension)
      specitalMesh = this.findMeshFromIndex(sortByDimension, index)
      weatherInfo = sortByDimension[index]
    }
    if (specitalMesh && weatherInfo) {
      return [specitalMesh, weatherInfo]
    } else {
      throw new Error(`cannot get the ${dimension} mesh`);
    }
  }

  getArrayIndexBy = (highOrLowest: string, array: any[]): number => {
    let position
    if (highOrLowest === 'highest') {
      position = 0
    } else if (highOrLowest === 'lowest') {
      position = array.length - 1
    }
    return position || 0
  }

  findMeshFromIndex = (array: DistrictWeatherInfo[], index: number): Mesh => {
    let retrunMesh: Mesh = new Mesh()
    this.taiwanMap.traverse(mesh => {
      if ((<Mesh>mesh).name === array[index].enDistrictAndCity) {
        retrunMesh = (<Mesh>mesh)
      }
    })
    if (retrunMesh) {
      return retrunMesh
    } else {
      throw new Error("can't traverse to get mesh info");
    }
  }

  animate = () => {
    if (this.renderer.info.render.frame < 2000) {
      requestAnimationFrame(this.animate);
    }
    this.renderer.render(this.scene, this.camera);
  };
}