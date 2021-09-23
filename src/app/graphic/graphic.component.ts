import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import gsap, { Power1 } from 'gsap';
import { BoxGeometry, CameraHelper, Clock, Color, CylinderGeometry, DataTexture, DirectionalLight, DirectionalLightHelper, DoubleSide, Font, FontLoader, FrontSide, Group, HemisphereLight, HemisphereLightHelper, IcosahedronBufferGeometry, Intersection, IUniform, Light, LightShadow, Material, Mesh, MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial, MeshStandardMaterial, Object3D, PerspectiveCamera, PlaneGeometry, PointLight, PointLightHelper, Raycaster, Scene, Shader, ShaderMaterial, SphereGeometry, SpotLight, SpotLightHelper, TextGeometry, Vector3, WebGL1Renderer, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { WeatherService } from '../weather.service';
import { DistrictGraphData, DistrictMeshData, MapInfoInFirebase } from '../interfaces';
import { AngularFireDatabase, AngularFireList } from '@angular/fire/database';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { environment } from 'src/environments/environment';
import { ImageProcessingService } from '../image-processing.service';
import { ColorUtilService } from '../color-util.service';
import { CloudService } from '../cloud.service';
import { Observable } from 'rxjs';
import { MeshUtilService } from '../mesh-util.service';
import { TextMeshService } from '../text-mesh.service';

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
  pointLight: PointLight
  hemisphereLight: HemisphereLight
  spotlight: SpotLight
  raycaster: Raycaster
  mouse: { x: number, y: number }
  taiwanMap: Object3D
  mouseHoverAnyMesh: boolean
  orbitcontrols: OrbitControls
  meshDataOnHtml: DistrictMeshData | undefined
  htmlTextColor: string = '#666666'
  mouseHoverDetalessMesh: boolean = false
  meshesData: DistrictMeshData[]
  box: Object3D
  box2: Object3D
  mapGltf?: GLTF
  showPopup: boolean = false;
  toneColor: { maxHex: string, minHex: string } = { maxHex: 'EEF588', minHex: '70a7f3' }
  units: { tone: string, height: string } = { tone: '溫', height: '降雨量' }
  dimensionRequirement: { height: boolean, tone: boolean } = { height: true, tone: true }
  toneExtremum: { max: number, min: number } = { max: 0, min: 0 }
  dbList: AngularFireList<any>
  sumHeight: number;
  measureRenderTime: number = 0
  cloud?: Object3D

  constructor(
    private weatherService: WeatherService,
    private db: AngularFireDatabase,
    private route: ActivatedRoute,
    private imageProcess: ImageProcessingService,
    private colorUtil: ColorUtilService,
    private cloudService: CloudService,
    private meshUtilService: MeshUtilService,
    private textMeshService: TextMeshService
  ) {
    this.dbList = this.db.list('maps')
    this.scene = new Scene()
    this.camera = new PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new WebGLRenderer({ precision: "lowp", antialias: true })
    this.directionalLight = new DirectionalLight()
    this.pointLight = new PointLight()
    this.hemisphereLight = new HemisphereLight()
    this.spotlight = new SpotLight()
    this.raycaster = new Raycaster()
    this.mouse = { x: 0, y: 0 }
    this.taiwanMap = new Object3D()
    this.mouseHoverAnyMesh = false
    this.orbitcontrols = new OrbitControls(this.camera, this.renderer.domElement)
    this.meshesData = []

    this.box = new Mesh()
    this.box2 = new Mesh()
    this.light = new PointLight()
    this.sumHeight = 0
  }

  ngOnInit(): void {
  }

  blurCanvas = () => {
    this.showPopup = !this.showPopup
    this.animate()
  }

  async ngAfterViewInit() {
    this.setupRenderer()
    this.setupCamera()
    this.setupScene()
    this.initCloud()
    this.setupLight()
    // this.setupBoxForTest()
    this.setUpTaiwan3dModel().then((Taiwan3dModel: GLTF) => {
      this.mapGltf = Taiwan3dModel
      const mapId = this.route.snapshot.paramMap.get('id') || undefined
      Taiwan3dModel.scene.scale.set(0.1, 0.1, 0.1)
      this.setupMap(mapId)
    })

    this.dbList.snapshotChanges(['child_added']).subscribe(actions => {
      actions.forEach(action => {
        // console.log(action.type);
        // console.log(action.key);
        // console.log(action.payload.val());
      });
    });
    setTimeout(() => {
      let expectedFrameRate = this.renderer.info.render.frame / 30
      let useHighPerformance = expectedFrameRate > 10
      let useLowPerformance = expectedFrameRate < 4
      console.log(expectedFrameRate, useHighPerformance);
      if (useHighPerformance) {
        const hqLight = new DirectionalLight()
        this.setupShadowTexture(hqLight, 1024)
        hqLight.intensity = 0.35
        hqLight.color = new Color(0xffffff)
        hqLight.position.set(-7, 7, -5)
        hqLight.castShadow = true
        this.directionalLight.removeFromParent()
        this.scene.add(hqLight)
      }
      if (useLowPerformance) {
        // this.renderer = new WebGLRenderer({ antialias: true, precision: "highp" })
        const hqLight = new DirectionalLight()
        hqLight.castShadow = false
        hqLight.intensity = 0.35
        hqLight.color = new Color(0xffffff)
        hqLight.position.set(-7, 7, -5)
        this.directionalLight.removeFromParent()
        this.scene.add(hqLight)
      }
    }, 6000);
  }

  initCloud = () => {
    this.cloudService.initCloudMesh().then(next => {
      this.cloud = next
      this.scene.add(next)
    })
  }

  paintMeshFrom = (array: DistrictMeshData[], meshToPaint: Mesh, paintNotFoundMesh: { r: number, g: number, b: number } = { r: 1, g: 1, b: 1 }) => {
    const meshData = this.meshUtilService.findDataByMeshName(array, meshToPaint)
    if (meshData && meshData.rgbColor) {
      // @ts-ignore
      meshToPaint.material.color = meshData && meshData.rgbColor ? meshData.rgbColor : paintNotFoundMesh
    }
  }

  setCloudDisplay = (shouldShow: boolean) => {
    const isShowing = this.scene.children.find(mesh => mesh.name === this.cloud?.name)
    if (!this.cloud) return
    if (shouldShow && !isShowing) {
      this.scene.add(this.cloud)
    } else if (!shouldShow && isShowing) {
      this.scene.remove(isShowing)
    }
  }

  onMousemove = (event: MouseEvent) => {
    event.preventDefault()
    this.mouse = this.updateMousePosiion(event)
    this.raycaster.setFromCamera(this.mouse, this.camera)
    const mapMeshes = this.taiwanMap.children[0]

    if (mapMeshes) {
      const intersactions = this.raycaster.intersectObjects(mapMeshes.children, true)
      if (intersactions.length > 0) {
        this.mouseHoverAnyMesh = true
        this.onMouseHoveringLand(mapMeshes, intersactions)
      } else if (this.mouseHoverAnyMesh) {
        this.mouseHoverAnyMesh = false
        this.onMouseLeavingLand(mapMeshes)
      }
    } else {
      // scene not setup yet or had gone
    }
  }

  onMouseHoveringLand = (mapMeshes: Object3D, intersactions: Intersection[]) => {
    this.meshUtilService.transparentMeshes(mapMeshes)
    this.setCloudDisplay(false)
    this.textMeshService.transparentTextMesh()
    const nearestToCamera: Intersection = intersactions.sort((a, b) => a.distance - b.distance)[0]
    const meshOnHover = <Mesh>nearestToCamera.object
    this.paintMeshFrom(this.meshesData, meshOnHover);
    // @ts-ignore
    meshOnHover.material.opacity = 1;
    const districtColor = this.meshUtilService.findDataByMeshName(this.meshesData, meshOnHover)?.rgbColor;
    if (districtColor) {
      this.htmlTextColor = '#' + this.colorUtil.convert0to1ToHex(districtColor);
      this.mouseHoverDetalessMesh = false
    } else { this.mouseHoverDetalessMesh = true }
    this.textMeshService.paintMapTextFromMesh(meshOnHover)
    this.updateTextOnHtml(intersactions)
  }

  onMouseLeavingLand = (mapMeshes: Object3D) => {
    this.setCloudDisplay(true)
    mapMeshes.traverse(object3d => {
      if ((<Mesh>object3d).isMesh) {
        this.paintMeshFrom(this.meshesData, <Mesh>object3d);
        // @ts-ignore
        (<Mesh>object3d).material.opacity = 1
      }
    })
    this.textMeshService.paintColorOnMapText()
  }

  updateTextOnHtml = (intersactions: Intersection[]) => {
    const nearestCamera: Intersection = intersactions.sort((a, b) => a.distance - b.distance)[0]
    this.meshDataOnHtml = this.meshUtilService.findDataByMeshName(this.meshesData, <Mesh>nearestCamera.object)
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
    // this.camera.position.set(5, 16, 1);
    this.camera.position.set(0, 16, 0);
    // this.camera.lookAt(4, 0, 0);
    this.camera.lookAt(0, 0, 0);
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

  setupShadowTexture = (light: DirectionalLight, textureSize: number) => {
    light.shadow.camera.near = 8;
    light.shadow.camera.far = 18;
    light.shadow.camera.left = -8;
    light.shadow.camera.right = 6;
    light.shadow.camera.top = 6;
    light.shadow.camera.bottom = 0;
    light.shadow.mapSize.width = textureSize
    light.shadow.mapSize.height = textureSize
  }

  setupLight = () => {
    this.hemisphereLight.intensity = 0.8
    this.hemisphereLight.color = new Color(0xffffff)
    this.scene.add(this.hemisphereLight)

    this.setupShadowTexture(this.directionalLight, 512)

    this.directionalLight.intensity = 0.35
    this.directionalLight.color = new Color(0xffffff)
    this.directionalLight.position.set(-7, 7, -5)
    this.directionalLight.castShadow = true
    this.scene.add(this.directionalLight)
    // this.scene.add(new CameraHelper(this.directionalLight.shadow.camera));

    this.pointLight.intensity = 0.1
    this.pointLight.color = new Color(0xffffff)
    this.pointLight.position.set(5, 6, -2)
    this.scene.add(this.pointLight)
    // this.scene.add(new PointLightHelper(this.pointLight));
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
      const mapMeshGraph = this.weatherService.districtsEnZhMap.find(map => {
        return map.zhCity === meshData.zhCityName && map.zhDistrict === meshData.zhDistrictName
      })
      if (mapMeshGraph) {
        meshData.enCityName = mapMeshGraph.enCity
        meshData.enDistrictName = mapMeshGraph.enDistrict
        return meshData
      } else {
        console.error(meshData);
        alert(`匯入表單資料時，找不到這個鄉鎮市區在3D模型上對應的物件：${meshData.zhCityName}${meshData.zhDistrictName}`)
        throw new Error("A Mesh Has No English Name");
      }
    })
  }

  getToneRange = (WeatherInDistricts: DistrictMeshData[]) => {
    const sortByTemp = WeatherInDistricts.sort((a, b) => +a.tone - +b.tone)
    const maxTone = +sortByTemp[sortByTemp.length - 1].tone
    const minTone = +sortByTemp[0].tone
    return [maxTone, minTone]
  }

  getMaterialColorByRate = (highestTemp: number, lowestTemp: number, currentTemp: number): { r: number, g: number, b: number, } => {
    const colorRate = (currentTemp - highestTemp) / (lowestTemp - highestTemp)
    const hashColor = this.colorUtil.blendHexColors('#' + this.toneColor.maxHex, '#' + this.toneColor.minHex, colorRate)
    return this.colorUtil.convertHexTo0to1(hashColor)
  }

  animateDistrictsHeight = () => {
    const [maxHeight, minHeight] = this.textMeshService.getHeightRange(this.meshesData)
    for (let i = 0; i < this.meshesData.length; i++) {
      const height = this.meshesData[i].height || 0
      const from = { scaleY: 1 }
      const normalizedScale = (+height - minHeight) / (maxHeight - minHeight);
      const to = { scaleY: normalizedScale * 20 + 1 }
      const districtMeshAnimation =
        gsap.to(
          from, {
          ...to,
          duration: 1,
          onStart: (() => {
            if (height !== 0) {
              this.meshesData[i].mesh3d.castShadow = true
            }
          }),
          onUpdate: (() => {
            this.meshesData[i].mesh3d.scale.setY(from.scaleY)
            this.meshesData[i].mesh3d.position.setY(from.scaleY / 2)
          }),
          ease: Power1.easeInOut
        }
        ).delay(1).play()
    }
  }

  setUpTaiwan3dModel = () => {
    const loader = new GLTFLoader()
    return loader.loadAsync(this.weatherService.addBaseUrl('/assets/taiwam15.gltf'))

  }

  setupMap = (mapId?: string) => {
    console.log(mapId);

    if (mapId && mapId !== 'weather') {
      // google sheet 資料
      this.weatherService.getMapDataFromFirebase(mapId).subscribe(mapData => {
        this.setupTone(mapData)
        this.textMeshService.setupDimensionText(this.dimensionRequirement, mapData)
        const googleSheetId = this.weatherService.getGoogleSheetIdFromUrl(mapData.sourceUrl)
        this.weatherService.getGoogleSheetInfo(googleSheetId).subscribe(graphData => {
          this.generateMap(graphData)
        })
      })
    } else {
      // weather 資料
      this.weatherService.getWeatherInfo().subscribe(graphData => {
        // gltf.scene.position.set(0, 0, this.move)
        this.generateMap(graphData)
      });
    }
  }

  setupTone = (mapInfo: MapInfoInFirebase) => {
    this.toneColor.maxHex = mapInfo.MaxToneHex
    this.toneColor.minHex = mapInfo.MinToneHex
    this.units.height = mapInfo.HeightDimensionUnit
    this.units.tone = mapInfo.ToneDimensionUnit
  }

  generateMap = (graphData: DistrictGraphData[]) => {
    console.log(graphData);
    const gltf: GLTF = <GLTF>this.mapGltf
    if (this.taiwanMap) this.taiwanMap.removeFromParent()
    // gltf.scene.position.set(0, 0, this.move)
    // this.move++
    this.setupMeshData(graphData)
    this.toneExtremum = this.getToneExtremum(this.meshesData)
    this.sumHeight = this.getSumHeight(this.meshesData)
    this.setupMapMesh(gltf.scene)
    this.textMeshService.setupAndAnimateTexts(this.camera, this.orbitcontrols, this.scene, this.dimensionRequirement, this.taiwanMap, this.meshesData)
    this.animateDistrictsHeight()
    this.scene.add(gltf.scene)
  }

  setupMeshData = (graphData: DistrictGraphData[]) => {
    this.meshesData = this.createMeshesData(graphData)
    this.meshesData = this.assignMeshesdEnName(this.meshesData)
  }

  setupMapMesh = (scene: Group) => {
    const mapMaterial = new MeshPhongMaterial({ opacity: 1.0, transparent: true })
    const [maxTone, minTone] = this.getToneRange(this.meshesData)
    this.taiwanMap = scene;

    scene.traverse(object3d => {
      const mesh: Mesh = (<Mesh>object3d)
      if (mesh.isMesh) {
        mesh.material = mapMaterial.clone();
        mesh.receiveShadow = true
        const meshData = this.meshUtilService.findDataByMeshName(this.meshesData, mesh)
        if (meshData) {
          // 這邊因為有複數的資料，如果有兩個重複的鄉鎮市區資料，那麼地圖會抓到第一個，然後染色。第二個鄉鎮市區資料則不會染色。當mousemove抓到之後染色時就抓不到資料
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

  

  getToneExtremum = (meshesData: DistrictMeshData[]): { max: number, min: number } => {
    const sortedMesh = meshesData.sort((a, b) => +b.tone - +a.tone)
    return { max: sortedMesh[0].tone, min: sortedMesh[sortedMesh.length - 1].tone }
  }

  getSumHeight = (meshesData: DistrictMeshData[]): number => {
    let sum = 0
    meshesData.forEach(mesh => sum += mesh.height)
    return sum
  }

  

  faceCamera = (objects: Object3D[]) => {
    objects.forEach(object => object.lookAt(this.camera.position))
  }

  animate = () => {

    if (environment.isRenderCountLimited) {
      if (this.renderer.info.render.frame < 900) {
        if (!this.showPopup) {
          requestAnimationFrame(this.animate);
          this.renderer.render(this.scene, this.camera);
        }
      }
    } else {
      if (!this.showPopup) {
        requestAnimationFrame(this.animate);
        this.renderer.render(this.scene, this.camera);
      }
    }
  };
}