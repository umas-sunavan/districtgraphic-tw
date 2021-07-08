import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Location as ngLocation } from '@angular/common';
import gsap, { Power1 } from 'gsap';
import { BackSide, BoxGeometry, CameraHelper, Color, CylinderGeometry, DirectionalLight, DirectionalLightHelper, Font, FontLoader, FrontSide, Group, HemisphereLight, HemisphereLightHelper, IcosahedronBufferGeometry, Intersection, IUniform, Light, LightShadow, Material, Mesh, MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial, MeshStandardMaterial, Object3D, PerspectiveCamera, PointLight, PointLightHelper, Raycaster, Scene, Shader, ShaderMaterial, SphereGeometry, SpotLight, SpotLightHelper, TextGeometry, Vector3, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { WeatherService } from '../weather.service';
import { DistrictGraphData, DistrictMeshData, DistrictWeatherInfo, EnZhMap } from '../interfaces';
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
  mouseHoveAnyMesh: boolean
  orbitcontrols: OrbitControls
  textsMeshAndColor: { textMesh: Mesh, districtMesh: Mesh, textHexColor: string }[]
  meshDataOnHtml: DistrictMeshData | undefined
  htmlTextColor: string = '#666666'
  mouseHoverDetalessMesh: boolean = false
  meshesData: DistrictMeshData[]
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
    this.textsMeshAndColor = []
    this.mouseHoveAnyMesh = false
    this.orbitcontrols = new OrbitControls(this.camera, this.renderer.domElement)
    this.meshesData = []

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
    // this.setupBoxForTest()
    this.setupMap()
  }

  transparentMesh = (mesh: Mesh, opacity: number = 0.6) => {
    if (mesh.isMesh) {
      const currentMaterial: Material = (<Material>mesh.material)
      // @ts-ignore
      currentMaterial.color = { r: 1, g: 1, b: 1 };
      currentMaterial.opacity = opacity
    }
  }

  paintMeshFrom = (array: DistrictMeshData[], meshToPaint: Mesh, paintNotFoundMesh: { r: number, g: number, b: number } = { r: 1, g: 1, b: 1 }) => {
    const meshData = this.mockFindDataByMeshName(array, meshToPaint)
    if (meshData && meshData.rgbColor) {
      // @ts-ignore
      meshToPaint.material.color = meshData && meshData.rgbColor ? meshData.rgbColor : paintNotFoundMesh
    }
  }

  transparentMeshes = (scene: Object3D, opacity: number = 0.6) => {
    scene.traverse(object3d => this.transparentMesh(<Mesh>object3d, opacity))
  }

  paintMapTextFrom = (mesh: Mesh) => {
    const textAboveMesh = this.textsMeshAndColor.filter(text => text.textMesh.name.includes(mesh.name))
    if (textAboveMesh.length !== 0) {
      // @ts-ignore 
      textAboveMesh.forEach(foundText => foundText.textMesh.material.color = this.convertHexTo0to1(foundText.textHexColor))
    } else { console.error('no mesh text to color!') }
  }

  paintColorOnMapText = () => {
    this.textsMeshAndColor.forEach(({ textMesh, textHexColor: textColor }) => {
      // @ts-ignore
      textMesh.material.color = this.convertHexTo0to1(textColor)
    });
  }

  onMousemove = (event: MouseEvent) => {
    event.preventDefault()
    this.mouse = this.updateMousePosiion(event)
    this.raycaster.setFromCamera(this.mouse, this.camera)
    const mapMeshes = this.taiwanMap.children[0]
    if (mapMeshes) {
      const intersactions = this.raycaster.intersectObjects(mapMeshes.children, true)
      if (intersactions.length > 0) {
        this.mouseHoveAnyMesh = true
        this.onMouseHoveringMap(mapMeshes, intersactions)
      } else if (this.mouseHoveAnyMesh) {
        this.mouseHoveAnyMesh = false
        this.onMouseLeavingMap(mapMeshes)
      }
    } else { console.error("no secene object") }
  }

  onMouseHoveringMap = (mapMeshes: Object3D, intersactions: Intersection[]) => {
    this.transparentMeshes(mapMeshes)
    this.textsMeshAndColor.forEach(textMesh => this.transparentMesh(textMesh.textMesh))
    const nearestToCamera: Intersection = intersactions.sort((a, b) => a.distance - b.distance)[0]
    const meshOnHover = <Mesh>nearestToCamera.object
    this.paintMeshFrom(this.meshesData, meshOnHover);
    // @ts-ignore
    meshOnHover.material.opacity = 1;
    const districtColor = this.mockFindDataByMeshName(this.meshesData, meshOnHover)?.rgbColor;
    if (districtColor) {
      this.htmlTextColor = '#' + this.convert0to1ToHex(districtColor);
      this.mouseHoverDetalessMesh = false
    } else { this.mouseHoverDetalessMesh = true }
    this.paintMapTextFrom(meshOnHover)
    this.updateTextOnHtml(intersactions)
  }

  onMouseLeavingMap = (mapMeshes: Object3D) => {
    mapMeshes.traverse(object3d => {
      if ((<Mesh>object3d).isMesh) {
        this.paintMeshFrom(this.meshesData, <Mesh>object3d);
        // @ts-ignore
        (<Mesh>object3d).material.opacity = 1
      }
    })
    this.paintColorOnMapText()
  }

  updateTextOnHtml = (intersactions: Intersection[]) => {
    const nearestCamera: Intersection = intersactions.sort((a, b) => a.distance - b.distance)[0]
    this.meshDataOnHtml = this.mockFindDataByMeshName(this.meshesData, <Mesh>nearestCamera.object)
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
    this.animateCamera()
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

  setupBoxForTest = () => {
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

  createMeshesData = (graphsData: DistrictGraphData[]): DistrictMeshData[] => {
    return graphsData.map(graph => {
      const meshdata = new DistrictMeshData()
      meshdata.tone = graph.tone
      meshdata.height = graph.height
      meshdata.zhCityName = graph.cityName
      meshdata.zhDistrictName = graph.districtName
      return meshdata
    })
  }

  assignMeshesdEnName = (meshesData: DistrictMeshData[]): DistrictMeshData[] => {
    return meshesData.map(meshData => {
      const mapMeshGraph = this.weatherServer.districtsEnZhMap.find(map => {
        return map.zhCity === meshData.zhCityName && map.zhDistrict === meshData.zhDistrictName
      })
      if (mapMeshGraph) {
        meshData.enCityName = mapMeshGraph.enCity
        meshData.enDistrictName = mapMeshGraph.enDistrict
        return meshData
      } else {
        throw new Error("A Mesh Has No English Name");
      }
    })
  }

  blendHexColors = (c0: string, c1: string, p: number) => {
    var f = parseInt(c0.slice(1), 16), t = parseInt(c1.slice(1), 16), R1 = f >> 16, G1 = f >> 8 & 0x00FF, B1 = f & 0x0000FF, R2 = t >> 16, G2 = t >> 8 & 0x00FF, B2 = t & 0x0000FF;
    return "" + (0x1000000 + (Math.round((R2 - R1) * p) + R1) * 0x10000 + (Math.round((G2 - G1) * p) + G1) * 0x100 + (Math.round((B2 - B1) * p) + B1)).toString(16).slice(1);
  }

  mockGetToneRange = (WeatherInDistricts: DistrictGraphData[]) => {
    const sortByTemp = WeatherInDistricts.sort((a, b) => +a.tone - +b.tone)
    const maxTone = +sortByTemp[sortByTemp.length - 1].tone
    const minTone = +sortByTemp[0].tone
    return [maxTone, minTone]
  }

  mockGetHeightRange = (meshData: DistrictMeshData[]) => {
    const sortByTemp = meshData.sort((a, b) => +a.height - +b.height)
    const maxHeight = +sortByTemp[sortByTemp.length - 1].height
    const minHeight = +sortByTemp[0].height
    return [maxHeight, minHeight]
  }

  mockFindDataByMeshName = (meshesData: DistrictMeshData[], mesh: Mesh): DistrictMeshData | undefined => {
    return meshesData.find(meshData => `${meshData.enDistrictName}_${meshData.enCityName}` === mesh.name)
  }

  getMaterialColorByRate = (highestTemp: number, lowestTemp: number, currentTemp: number): { r: number, g: number, b: number, } => {
    const colorRate = (currentTemp - highestTemp) / (lowestTemp - highestTemp)
    const hashColor = this.blendHexColors('#EEF588', '#70B7F3', colorRate)
    return this.convertHexTo0to1(hashColor)
  }

  mockAnimateDistrictsHeight = () => {
    const [maxHeight, minHeight] = this.mockGetHeightRange(this.meshesData)
    const districtMeshAnimations: any[] = []
    for (let i = 0; i < this.meshesData.length; i++) {
      const height = this.meshesData[i].height || '0'
      const from = { scaleY: 1 }
      const normalizedScale = (+height - minHeight) / (maxHeight - minHeight);
      const to = { scaleY: normalizedScale * 20 + 1 }
      const districtMeshAnimation =
        gsap.to(
          from, {
          ...to,
          duration: 1,
          onStart: (() => {
            if (+height !== 0) {
              this.meshesData[i].mesh3d.castShadow = true
            }
          }),
          onUpdate: (() => {
            this.meshesData[i].mesh3d.scale.setY(from.scaleY)
            this.meshesData[i].mesh3d.position.setY(from.scaleY / 2)
            this.textsMeshAndColor[0].districtMesh.position.setY(from.scaleY / 2)
          }),
          ease: Power1.easeInOut
        }
        ).delay(1).play()
      districtMeshAnimations.push(districtMeshAnimation)
    }
  }

  setupMap = () => {
    const loader = new GLTFLoader()
    loader.loadAsync(this.ngLocation.prepareExternalUrl('/assets/taiwam15.gltf')).then(gltf => {
      gltf.scene.scale.set(0.1, 0.1, 0.1)
      this.weatherServer.getMockWeatherInfo().subscribe(graphData => {
        this.setupMapMesh(gltf.scene, graphData)
        this.setupAndAnimateTexts()
        this.mockAnimateDistrictsHeight()
      });
      this.scene.add(gltf.scene)
    })
  }

  setupMapMesh = (scene: Group, graphData: DistrictGraphData[]) => {
    const mapMaterial = new MeshPhongMaterial({ opacity: 1.0, transparent: true })
    this.meshesData = this.createMeshesData(graphData)
    this.meshesData = this.assignMeshesdEnName(this.meshesData)
    const [maxTone, minTone] = this.mockGetToneRange(graphData)
    this.taiwanMap = scene;

    scene.traverse(object3d => {
      const mesh: Mesh = (<Mesh>object3d)
      if (mesh.isMesh) {
        mesh.material = mapMaterial.clone();
        mesh.receiveShadow = true
        const meshData = this.mockFindDataByMeshName(this.meshesData, mesh)
        if (meshData) {
          meshData.rgbColor = this.getMaterialColorByRate(maxTone, minTone, meshData.tone);
          // @ts-ignore
          mesh.material.color = meshData.rgbColor
          meshData.mesh3d = mesh
        } else {
          // @ts-ignore
          mesh.material.color = { r: 1, g: 1, b: 1 }
        }
      }
    });
  }

  mockGetArrayIndexBy = (extremumType: string, array: any[]): number => {
    let position
    if (extremumType === 'max') {
      position = 0
    } else if (extremumType === 'min') {
      position = array.length - 1
    }
    return position || 0
  }

  mockFindMeshFromIndex = (array: DistrictMeshData[], index: number): Mesh => {
    let retrunMesh: Mesh = new Mesh()
    this.taiwanMap.traverse(mesh => {
      if ((<Mesh>mesh).name === `${array[index].enDistrictName}+${array[index].enCityName}`) {
        retrunMesh = (<Mesh>mesh)
      }
    })
    if (retrunMesh) {
      return retrunMesh
    } else {
      throw new Error("can't traverse to get mesh info");
    }
  }

  getExtremumMesh = (extremumType: string, dimension: string, meshesData: DistrictMeshData[]): DistrictMeshData => {
    let extremumToneMesh: Mesh | undefined = undefined
    let returnMeshData: DistrictMeshData | undefined = undefined
    if (dimension === 'tone') {
      const dataSortByDimension = meshesData.sort((a, b) => +b.tone - +a.tone)
      const extremumIndex = this.mockGetArrayIndexBy(extremumType, dataSortByDimension)
      extremumToneMesh = this.mockFindMeshFromIndex(dataSortByDimension, extremumIndex)
      returnMeshData = dataSortByDimension[extremumIndex]
    } else if (dimension === 'height') {
      const dataSortByDimension = meshesData.sort((a, b) => +b.height - +a.height)
      const extremumIndex = this.mockGetArrayIndexBy(extremumType, dataSortByDimension)
      extremumToneMesh = this.mockFindMeshFromIndex(dataSortByDimension, extremumIndex)
      returnMeshData = dataSortByDimension[extremumIndex]
    }
    if (returnMeshData) {
      return returnMeshData
    } else {
      throw new Error(`cannot get the ${dimension} mesh`);
    }
  }

  setupAndAnimateTexts = () => {
    const maxToneMesh = this.getExtremumMesh('max', 'tone', this.meshesData);
    const minToneMesh = this.getExtremumMesh('min', 'tone', this.meshesData);
    const maxHeightMesh = this.getExtremumMesh('max', 'height', this.meshesData);
    const minHeightMesh = this.getExtremumMesh('min', 'height', this.meshesData);

    const loader = new FontLoader()
    loader.load(this.ngLocation.prepareExternalUrl('/assets/jf-openhuninn-1.1_Regular_districts_words.json'), ((font) => {

      const maxToneTitleMesh = this.createTextMesh(font, maxToneMesh.mesh3d, maxToneMesh.zhDistrictName, maxToneMesh.rgbColor)
      const minToneTitleMesh = this.createTextMesh(font, minToneMesh.mesh3d, minToneMesh.zhDistrictName, minToneMesh.rgbColor)
      const maxHeightTitleMesh = this.createTextMesh(font, maxHeightMesh.mesh3d, maxHeightMesh.zhDistrictName, maxHeightMesh.rgbColor)
      // const minHeightTitleMesh = this.createTextMesh(font, minHeightMesh.mesh3d, minHeightMesh.zhDistrictName, minHeightMesh.rgbColor)

      const maxToneSubtitleMesh = this.createTextMesh(font, maxToneMesh.mesh3d, `最高溫 ${Math.round(+maxToneMesh.tone * 10) / 10}度`, maxToneMesh.rgbColor)
      const minToneSubtitleMesh = this.createTextMesh(font, minToneMesh.mesh3d, `最低溫 ${Math.round(+minToneMesh.tone * 10) / 10}度`, minToneMesh.rgbColor)
      const maxHeightSubtitle = this.createTextMesh(font, maxHeightMesh.mesh3d, `最高降雨量 ${Math.round(+maxHeightMesh.height * 10) / 10}mm`, maxHeightMesh.rgbColor)
      // const minHeightSubtitle = this.createTextMesh(font, minHeightMesh.mesh3d, `最高降雨量 ${Math.round(+minHeightMesh.height * 10) / 10}mm`, minHeightMesh.rgbColor)

      const maxToneMeshGroup = this.createTextMeshGroup(maxToneTitleMesh, maxToneSubtitleMesh)
      const minToneMeshGroup = this.createTextMeshGroup(minToneTitleMesh, minToneSubtitleMesh)
      const maxHeightMeshGroup = this.createTextMeshGroup(maxHeightTitleMesh, maxHeightSubtitle)
      // const minHeightMeshGroup = this.createTextMeshGroup(minHeightTitleMesh, minHeightSubtitle)
      this.animateText(maxToneMeshGroup, maxToneMesh)
      this.animateText(minToneMeshGroup, minToneMesh)
      this.animateText(maxHeightMeshGroup, maxHeightMesh)
      // this.animateText(minHeightMeshGroup, minHeightMesh)

      this.orbitcontrols.addEventListener('change', () => {
        this.faceCamera([
          maxToneMeshGroup,
          minToneMeshGroup,
          maxHeightMeshGroup,
          // minHeightMeshGroup,
        ])
      })
    }))
  }

  faceCamera = (meshes: Group[]) => meshes.forEach(mesh => mesh.lookAt(this.camera.position))

  animateText = (fontMesh: Mesh | Group, meshData: DistrictMeshData) => {
    const [highestRainning, lowestRainning] = this.mockGetHeightRange(this.meshesData)
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

  animate = () => {
    if (this.renderer.info.render.frame < 2000) {
      requestAnimationFrame(this.animate);
    }
    this.renderer.render(this.scene, this.camera);
  };
}