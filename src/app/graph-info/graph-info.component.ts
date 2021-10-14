import { Component, Input, OnInit, Output, ViewChild, EventEmitter, AfterViewInit } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { FormControl, FormGroup, NgModel } from '@angular/forms';
import { DistrictMeshData, MapAttributeForm, MapInfoInFirebase, MapSource, ToneGradient } from '../interfaces';
import { WeatherService } from '../weather.service';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { calcPossibleSecurityContexts } from '@angular/compiler/src/template_parser/binding_parser';
import { CloudService } from '../cloud.service';
import mixpanel from 'mixpanel-browser'

@Component({
  selector: 'app-graph-info',
  templateUrl: './graph-info.component.html',
  styleUrls: ['./graph-info.component.scss']
})
export class GraphInfoComponent implements OnInit, AfterViewInit {
  showEditMapPopup: boolean = false
  showLinkPopup: boolean = false
  shareLink: string = ''
  showCreateMapPopup: boolean = false
  showBrowseMapsPopup: boolean = false
  mapName: string = '台灣天氣資訊地圖'
  author: string = '伍瑪斯'
  heightDimensionTitle: string = '今日降雨量'
  heightDimensionUnit: string = '毫米'
  toneDimensionTitle: string = '本日最高溫'
  toneDimensionUnit: string = '度C'
  requireToneDimension: boolean = true
  requireHeightDimension: boolean = true
  mapDescription: string = "透過氣象局Opendata，能夠取得每小時更新一次的氣象資料\n顏色代表每小時最高溫度，高度代表每小時降雨量\n資料來源是氣象局提供的資料唷！"
  sourceUrl: string = "https://docs.google.com/spreadsheets/d/1ydqYElUX25OfRwThdtlFLFN_Opww7tAUebjIcj_bX1Q/edit?usp=sharing"
  toneGradient: ToneGradient = { startColor: '70a7f3', endColor: 'EEF588' };
  isWeatherMap: boolean = true
  gradientPickers: ToneGradient[] = [
    { startColor: 'F8FF8B', endColor: 'F38461' },
    { startColor: 'EEF588', endColor: '70A7F3' },
    { startColor: 'FFB9D2', endColor: '88B4EF' },
    { startColor: 'BF4A4A', endColor: 'DC7EC7' },
    { startColor: '94F9C8', endColor: '89BBFF' },
  ]
  gradientSelectedIndex: number = 0
  allMaps: MapInfoInFirebase[] = []
  mapId = 'weather'
  cloudLastUpdate = ''
  constructor(
    public weatherService: WeatherService,
    private router: Router,
    private route: ActivatedRoute,
    private cloudService: CloudService
  ) { }
  @Input('districtColor') htmlTextColor: string = ''
  @Input('mouseHoverDetalessMesh') mouseHoverDetalessMesh: boolean = false
  @Input('mouseHoveAnyMesh') mouseHoveAnyMesh: boolean = false
  @Input('meshDataOnHtml') meshDataOnHtml?: DistrictMeshData;
  @Input('toneExtremum') toneExtremum: { max: number, min: number } = { max: 0, min: 0 }
  @Input('sumHeight') sumHeight: number = 0

  @Output() onMapChanged = new EventEmitter<string>()
  @Output() blurGraph = new EventEmitter<boolean>()


  ngOnInit(): void {
    this.initMixpanel()
    this.route.paramMap.subscribe(paramMap => {
      const mapId = paramMap.get('id') || ''
      this.mapId = mapId
      this.weatherService.getMapDataFromFirebase(mapId).subscribe(mapData => {
        this.author = mapData.author
        this.mapName = mapData.mapName
        this.heightDimensionTitle = mapData.HeightDimensionTitle
        this.heightDimensionUnit = mapData.HeightDimensionUnit
        this.toneDimensionTitle = mapData.ToneDimensionTitle
        this.toneDimensionUnit = mapData.ToneDimensionUnit
        this.requireHeightDimension = mapData.requireHeightDimension === "true" ? true : false
        this.requireToneDimension = mapData.requireToneDimension === "true" ? true : false
        this.mapDescription = mapData.mapDescription
        this.sourceUrl = mapData.sourceUrl
        this.toneGradient = { startColor: mapData.MinToneHex, endColor: mapData.MaxToneHex }
        this.isWeatherMap = mapData.isWeatherMap === "true" ? true : false
      })
      if (this.mapId === 'cloud') {
        this.cloudService.getCloudLastUpdate().subscribe(next => {
          this.cloudLastUpdate = next.cloudLastUpdate
          mixpanel.track('get_cloud_last_update', {'last_update': this.cloudLastUpdate});
        })
      }
    })
  }

  initMixpanel = () => {
    mixpanel.init('2364e64eb3aa323314fc7e5cc595dc73', {debug: true}); 
    mixpanel.track('landing', {'on map id': this.mapId, 'on map name': this.mapName});
  }

  async ngAfterViewInit() {
  }

  openBrowseMaps = (btn: any) => {
    this.blurGraph.emit(true)
    this.showBrowseMapsPopup = !this.showBrowseMapsPopup;
    btn.blur()
    this.weatherService.getAllMapsFromFirebase().subscribe(maps => {
      maps = this.appendDate(maps)
      maps = this.sortMapByDate(maps)
      this.allMaps = maps
    })
    mixpanel.track('open_browse_maps_popup');
  }

  closeBrowseMaps = () => {
    this.blurGraph.emit(false)
    this.showBrowseMapsPopup = !this.showBrowseMapsPopup
    mixpanel.track('close_browse_maps_popup');
  }

  clickSourseUrl = (sourceUrl:string) => {
    mixpanel.track('click_sourse_url', {'source_url': sourceUrl});
  }

  appendDate = (maps: MapInfoInFirebase[]) => maps.map(map => {
    map.createDate = new Date(map.createDate)
    return map
  })

  sortMapByDate = (maps: MapInfoInFirebase[]) => {
    return maps.sort( (a,b) => {
      const aDate = new Date(a.createDate)
      const bDate = new Date(b.createDate)
      return  bDate.getTime() - aDate.getTime()
    })
  }

  clickMapLink = (mapId: string) => {
    this.router.navigate(['/maps', mapId]);
    this.onMapChanged.emit(mapId)
    this.blurGraph.emit(false)
    this.showBrowseMapsPopup = !this.showBrowseMapsPopup;
    mixpanel.track('click_map', {'map_id': mapId, 'map_name': this.allMaps.find(map => map.mapUrl === mapId)?.mapName});
  }

  openCreateMapPop = (btn: any) => {
    this.blurGraph.emit(true)
    this.showCreateMapPopup = !this.showCreateMapPopup;
    btn.blur()
    mixpanel.track('open_create_map_popup');
  }

  closeCreateMapPop = () => {
    this.blurGraph.emit(false)
    this.showCreateMapPopup = !this.showCreateMapPopup
    mixpanel.track('close_create_map_popup');
  }

  clickTemplateSheet = () => {
    mixpanel.track('click_template_sheet');
  }

  urlLinkChange = (link: NgModel) => {
    mixpanel.track('change_create_map_url', { 'link': link.value});
  }

  submitUrl = (formGroup: any) => {
    this.showCreateMapPopup = !this.showCreateMapPopup
    this.showEditMapPopup = !this.showEditMapPopup
    console.log(formGroup.urlLink);
    mixpanel.track('open_editing_map_popup', { 'link': formGroup.urlLink});
  }

  closeEditingMap = () => {
    this.blurGraph.emit(false)
    this.showEditMapPopup = !this.showEditMapPopup
    mixpanel.track('close_editing_map_popup');
  }

  clickSubmit = (event: Event, submitBtn: any) => {
    event.preventDefault()
    submitBtn.click()
  }

  submitEditingMap = (mapAttribute: MapAttributeForm, toneGradient: ToneGradient, mapSource: MapSource) => {
    this.showEditMapPopup = !this.showEditMapPopup
    this.showLinkPopup = !this.showLinkPopup
    this.mapName = mapAttribute.mapTitle
    this.author = mapAttribute.authorName
    // add them in case they are not exist in the form due to the "disable" directive
    if (!mapAttribute.heightTitle) mapAttribute.heightTitle = ''
    if (!mapAttribute.toneTitle) mapAttribute.toneTitle = ''
    if (!mapAttribute.heightUnit) mapAttribute.heightUnit = ''
    if (!mapAttribute.toneUnit) mapAttribute.toneUnit = ''
    const pushedMapRef = this.weatherService.pushMapToFirebase(mapAttribute, toneGradient, mapSource)
    mixpanel.track('open_show_link_popup', { 'map_id': mapSource, 'map_name': mapAttribute.mapTitle});
    if (pushedMapRef.key) {
      const mapId: string = pushedMapRef.key
      this.router.navigate(['/maps', mapId]);
      this.weatherService.setMapRefAsUrlToFirebase(pushedMapRef, mapId)
      this.shareLink = window.location.origin + this.weatherService.addBaseUrl('') + 'maps/' + mapId
      this.onMapChanged.emit(mapId)
      mixpanel.track('map_created', { 'map_id': mapSource, 'map_name': mapAttribute.mapTitle});
    }
  }

  copyShareLink = (btnElement: HTMLButtonElement, shareLink: string) => {
    btnElement.children[1].innerHTML = "複製成功！"
    navigator.clipboard.writeText(shareLink)
    mixpanel.track('copy_share_link', { 'link': shareLink});
  }

  closeShowLinkPopup = () => {
    this.blurGraph.emit(false)
    this.showLinkPopup = !this.showLinkPopup
    mixpanel.track('close_show_link_popup');
  }

}
