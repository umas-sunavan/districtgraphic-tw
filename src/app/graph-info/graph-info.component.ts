import { Component, Input, OnInit, Output, ViewChild, EventEmitter, AfterViewInit } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { FormControl, FormGroup } from '@angular/forms';
import { DistrictMeshData, MapAttributeForm, MapInfoInFirebase, MapSource, ToneGradient } from '../interfaces';
import { WeatherService } from '../weather.service';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';


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
  toneDimensionTitle: string = '本日最高溫'
  requireToneDimension: boolean = true
  requireHeightDimension: boolean = true
  mapDescription: string = "經由Opendata抓出來的API資料"
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
  constructor(
    public weatherService: WeatherService,
    private router: Router,
    private route: ActivatedRoute,
  ) { }
  @Input('districtColor') htmlTextColor: string = ''
  @Input('mouseHoverDetalessMesh') mouseHoverDetalessMesh: boolean = false
  @Input('mouseHoveAnyMesh') mouseHoveAnyMesh: boolean = false
  @Input('meshDataOnHtml') meshDataOnHtml?: DistrictMeshData;
  @Input('toneExtremum') toneExtremum: { max: number, min: number} = { max: 0, min: 0}
  @Input('sumHeight') sumHeight: number = 0

  @Output() updateMapBySheetId = new EventEmitter<string>()
  @Output() blurGraph = new EventEmitter<boolean>()


  ngOnInit(): void {
    this.route.paramMap.subscribe(paramMap => {
      const mapId = paramMap.get('id')
      if (mapId) {
        this.weatherService.getMapDataFromFirebase(mapId).subscribe(mapData => {
          this.author = mapData.author
          this.mapName = mapData.mapName
          this.heightDimensionTitle = mapData.HeightDimensionTitle
          this.toneDimensionTitle = mapData.ToneDimensionTitle
          this.requireHeightDimension = mapData.requireHeightDimension === "true" ? true : false
          this.requireToneDimension = mapData.requireToneDimension === "true" ? true : false
          this.mapDescription = mapData.mapDescription
          this.sourceUrl = mapData.sourceUrl
          this.toneGradient = { startColor: mapData.MinToneHex, endColor: mapData.MaxToneHex}
          this.isWeatherMap = false
          console.log(mapData);
        })
      }
    })
  }

  ngAfterViewInit() {
  }

  openBrowseMaps = (btn: any) => {
    this.blurGraph.emit(true)
    this.showBrowseMapsPopup = !this.showBrowseMapsPopup;
    btn.blur()
    this.weatherService.getAllMapsFromFirebase().subscribe(maps => {
      this.allMaps = maps.map(map => {
        map.createDate = new Date(map.createDate)
        console.log(map.createDate);

        return map
      })
    })
  }


  clickMapLink = (mapId: string) => {
    this.router.navigate(['/maps', mapId]);
    this.updateMapBySheetId.emit(mapId)
    this.blurGraph.emit(false)
    this.showBrowseMapsPopup = !this.showBrowseMapsPopup;
  }

  openCreateProcess = (btn: any) => {
    this.blurGraph.emit(true)
    this.showCreateMapPopup = !this.showCreateMapPopup;
    btn.blur()
  }

  submitUrl = (formGroup: FormGroup) => {
    this.showCreateMapPopup = !this.showCreateMapPopup
    this.showEditMapPopup = !this.showEditMapPopup
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
    console.log(mapAttribute);
    // add them in case they are not exist in the form due to the "disable" directive
    if (!mapAttribute.heightTitle) mapAttribute.heightTitle = ''
    if (!mapAttribute.toneTitle) mapAttribute.toneTitle = ''
    const pushedMapRef = this.weatherService.pushMapToFirebase(mapAttribute, toneGradient, mapSource)
    if (pushedMapRef.key) {
      const mapId: string = pushedMapRef.key
      this.router.navigate(['/maps', mapId]);
      this.weatherService.setMapRefAsUrlToFirebase(pushedMapRef, mapId)
      this.shareLink = window.location.origin + this.weatherService.addBaseUrl('') + 'maps/' + mapId
      this.updateMapBySheetId.emit(mapId)
    }
  }

  copyShareLink = (btnElement: HTMLButtonElement, shareLink: string) => {
    btnElement.children[1].innerHTML = "複製成功！"
    navigator.clipboard.writeText(shareLink)
  }

}
