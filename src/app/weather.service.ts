import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpRequest } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { enZhMapping } from './en-zh-mapping';
import { EnZhMap, WeatherData, ApiWeatherData, Location as ApiLocation, DistrictWeatherInfo, DistrictGraphData, googleSheetRawData as GoogleSheetRawData, MapInfoInFirebase, MapAttributeForm, ToneGradient, MapSource, meshText } from './interfaces';
import { Location } from '@angular/common';
import { AngularFireDatabase } from '@angular/fire/database';
import { ActivatedRoute } from '@angular/router';

@Injectable({
  providedIn: 'root'
})

export class WeatherService {

  constructor(
    private httpclient: HttpClient,
    private location: Location,
    private db: AngularFireDatabase,
    private route: ActivatedRoute,
  ) {

  }

  // names we can find in the 3D model
  districtsEnZhMap: EnZhMap[] = enZhMapping
  googleSheetId: string = ''

  addBaseUrl = (relavieLink: string): string => this.location.prepareExternalUrl(relavieLink)
  getGoogleSheetIdFromUrl = (link: string) => link.replace('https://docs.google.com/spreadsheets', '').split('/')[2] + ''

  pushMapToFirebase = (mapAttribute: MapAttributeForm, toneGradient: ToneGradient, mapSource: MapSource) => {
    console.log(mapAttribute, mapAttribute.requireHeightDimension, mapAttribute.requireToneDimension);

    return this.db.list('maps').push({
      mapName: mapAttribute.mapTitle,
      mapDescription: mapAttribute.mapDescriptionInput,
      HeightDimensionTitle: mapAttribute.heightTitle,
      HeightDimensionUnit: mapAttribute.heightUnit,
      ToneDimensionTitle: mapAttribute.toneTitle,
      ToneDimensionUnit: mapAttribute.toneUnit,
      MaxToneHex: toneGradient.endColor,
      MinToneHex: toneGradient.startColor,
      author: mapAttribute.authorName,
      authorEmail: mapAttribute.authorEmail,
      sourceUrl: mapSource.urlLink,
      sourceData: '',
      createDate: new Date().toString(),
      mapUrl: 'null',
      requireHeightDimension: mapAttribute.requireHeightDimension.toString(),
      requireToneDimension: mapAttribute.requireToneDimension.toString(),
    })
  }

  setMapRefAsUrlToFirebase = (MapRef: any, url: string) => {
    MapRef.child('mapUrl').set(url, () => {
      console.log('window.location.origin, window.location', window.location.origin, window.location, this.addBaseUrl(''));
    })
  }

  findWeatherValue = (station: ApiLocation, elementName: string) => {
    const element = station.weatherElement.find(element => element.elementName === elementName)
    if (element) {
      return element.elementValue
    } else {
      console.error('No weather element found!')
      return '-99'
    }
  }

  findLocationValue = (station: ApiLocation, parameterName: string) => {
    const parameter = station.parameter.find(eachParameter => eachParameter.parameterName === parameterName)
    if (parameter) {
      return parameter.parameterValue
    } else {
      console.log('No location parameter found!')
      return ''
    }
  }

  getWeatherInfo = (): Observable<DistrictGraphData[]> => {
    const rawdata: Observable<GoogleSheetRawData> = of({
      "version": "0.6",
      "reqId": "0",
      "status": "ok",
      "sig": "863977479",
      "table": {
        "cols": [
          {
            "id": "A",
            "label": "",
            "type": "string"
          },
          {
            "id": "B",
            "label": "",
            "type": "string"
          },
          {
            "id": "C",
            "label": "",
            "type": "string"
          },
          {
            "id": "D",
            "label": "",
            "type": "string"
          },
          {
            "id": "E",
            "label": "",
            "type": "string"
          }
        ],
        "rows": [
          {
            "c": [
              {
                "v": "縣市"
              },
              {
                "v": "行政區"
              },
              {
                "v": "高度"
              },
              {
                "v": "色調"
              },
              {
                "v": "時間軸"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺南市"
              },
              {
                "v": "安平區"
              },
              {
                "v": "0"
              },
              {
                "v": "31.7"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "嘉義縣"
              },
              {
                "v": "大林鎮"
              },
              {
                "v": "1"
              },
              {
                "v": "34.4"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "新北市"
              },
              {
                "v": "平溪區"
              },
              {
                "v": "0"
              },
              {
                "v": "31.6"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "雲林縣"
              },
              {
                "v": "斗六市"
              },
              {
                "v": "29.5"
              },
              {
                "v": "33.8"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "南投縣"
              },
              {
                "v": "魚池鄉"
              },
              {
                "v": "2"
              },
              {
                "v": "32"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "屏東縣"
              },
              {
                "v": "竹田鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "34.6"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "苗栗縣"
              },
              {
                "v": "造橋鄉"
              },
              {
                "v": "3"
              },
              {
                "v": "-99"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "苗栗縣"
              },
              {
                "v": "頭屋鄉"
              },
              {
                "v": "5"
              },
              {
                "v": "-99"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺南市"
              },
              {
                "v": "下營區"
              },
              {
                "v": "0"
              },
              {
                "v": "33.2"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "屏東縣"
              },
              {
                "v": "萬丹鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "33.7"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "新北市"
              },
              {
                "v": "三峽區"
              },
              {
                "v": "8.5"
              },
              {
                "v": "34"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "彰化縣"
              },
              {
                "v": "大城鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "32.5"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺中市"
              },
              {
                "v": "大里區"
              },
              {
                "v": "0.5"
              },
              {
                "v": "33.4"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺中市"
              },
              {
                "v": "西屯區"
              },
              {
                "v": "0"
              },
              {
                "v": "32.6"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "嘉義縣"
              },
              {
                "v": "太保市"
              },
              {
                "v": "0"
              },
              {
                "v": "33.8"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺南市"
              },
              {
                "v": "學甲區"
              },
              {
                "v": "0"
              },
              {
                "v": "31.9"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "屏東縣"
              },
              {
                "v": "新園鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "32.1"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺中市"
              },
              {
                "v": "清水區"
              },
              {
                "v": "0"
              },
              {
                "v": "-99"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺南市"
              },
              {
                "v": "新化區"
              },
              {
                "v": "0"
              },
              {
                "v": "34.4"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺中市"
              },
              {
                "v": "石岡區"
              },
              {
                "v": "13"
              },
              {
                "v": "-99"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "桃園市"
              },
              {
                "v": "楊梅區"
              },
              {
                "v": "0"
              },
              {
                "v": "32.4"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "嘉義縣"
              },
              {
                "v": "六腳鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "32.8"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "雲林縣"
              },
              {
                "v": "斗南鎮"
              },
              {
                "v": "13"
              },
              {
                "v": "33.5"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺南市"
              },
              {
                "v": "北區"
              },
              {
                "v": "0"
              },
              {
                "v": "32.8"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "屏東縣"
              },
              {
                "v": "內埔鄉"
              },
              {
                "v": "44"
              },
              {
                "v": "36.2"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "新北市"
              },
              {
                "v": "樹林區"
              },
              {
                "v": "14.5"
              },
              {
                "v": "34.2"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺南市"
              },
              {
                "v": "官田區"
              },
              {
                "v": "0"
              },
              {
                "v": "33.8"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "高雄市"
              },
              {
                "v": "燕巢區"
              },
              {
                "v": "0"
              },
              {
                "v": "33"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "彰化縣"
              },
              {
                "v": "伸港鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "-99"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "雲林縣"
              },
              {
                "v": "土庫鎮"
              },
              {
                "v": "1.5"
              },
              {
                "v": "32.9"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺南市"
              },
              {
                "v": "將軍區"
              },
              {
                "v": "0"
              },
              {
                "v": "31.5"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "高雄市"
              },
              {
                "v": "永安區"
              },
              {
                "v": "0"
              },
              {
                "v": "32.1"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "南投縣"
              },
              {
                "v": "草屯鎮"
              },
              {
                "v": "65"
              },
              {
                "v": "34.2"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "屏東縣"
              },
              {
                "v": "屏東市"
              },
              {
                "v": "0"
              },
              {
                "v": "34.1"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "南投縣"
              },
              {
                "v": "國姓鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "33.1"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "新北市"
              },
              {
                "v": "石碇區"
              },
              {
                "v": "0"
              },
              {
                "v": "32.3"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺中市"
              },
              {
                "v": "豐原區"
              },
              {
                "v": "5"
              },
              {
                "v": "-99"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "新北市"
              },
              {
                "v": "五股區"
              },
              {
                "v": "8.5"
              },
              {
                "v": "32.8"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "雲林縣"
              },
              {
                "v": "褒忠鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "32.3"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "高雄市"
              },
              {
                "v": "旗津區"
              },
              {
                "v": "0"
              },
              {
                "v": "30.5"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "高雄市"
              },
              {
                "v": "大樹區"
              },
              {
                "v": "0"
              },
              {
                "v": "34.5"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "澎湖縣"
              },
              {
                "v": "西嶼鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "30.4"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "屏東縣"
              },
              {
                "v": "高樹鄉"
              },
              {
                "v": "13"
              },
              {
                "v": "35"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "嘉義縣"
              },
              {
                "v": "梅山鄉"
              },
              {
                "v": "64"
              },
              {
                "v": "33.2"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺東縣"
              },
              {
                "v": "延平鄉"
              },
              {
                "v": "15.5"
              },
              {
                "v": "31.2"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "苗栗縣"
              },
              {
                "v": "卓蘭鎮"
              },
              {
                "v": "79"
              },
              {
                "v": "-99"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺南市"
              },
              {
                "v": "楠西區"
              },
              {
                "v": "12"
              },
              {
                "v": "33.7"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "屏東縣"
              },
              {
                "v": "崁頂鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "33"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "彰化縣"
              },
              {
                "v": "二水鄉"
              },
              {
                "v": "132.5"
              },
              {
                "v": "34.4"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺南市"
              },
              {
                "v": "大內區"
              },
              {
                "v": "0"
              },
              {
                "v": "34.1"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺南市"
              },
              {
                "v": "南區"
              },
              {
                "v": "0"
              },
              {
                "v": "32"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "高雄市"
              },
              {
                "v": "美濃區"
              },
              {
                "v": "0"
              },
              {
                "v": "34.9"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "彰化縣"
              },
              {
                "v": "芬園鄉"
              },
              {
                "v": "12"
              },
              {
                "v": "33.5"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "新北市"
              },
              {
                "v": "鶯歌區"
              },
              {
                "v": "2"
              },
              {
                "v": "33.4"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺南市"
              },
              {
                "v": "南化區"
              },
              {
                "v": "3"
              },
              {
                "v": "35.4"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺南市"
              },
              {
                "v": "仁德區"
              },
              {
                "v": "0"
              },
              {
                "v": "32.6"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "桃園市"
              },
              {
                "v": "八德區"
              },
              {
                "v": "31.5"
              },
              {
                "v": "32.7"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺中市"
              },
              {
                "v": "北屯區"
              },
              {
                "v": "3"
              },
              {
                "v": "32.9"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "嘉義縣"
              },
              {
                "v": "水上鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "33.5"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "高雄市"
              },
              {
                "v": "鼓山區"
              },
              {
                "v": "0"
              },
              {
                "v": "31.3"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "彰化縣"
              },
              {
                "v": "鹿港鎮"
              },
              {
                "v": "0"
              },
              {
                "v": "32.3"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺南市"
              },
              {
                "v": "左鎮區"
              },
              {
                "v": "0"
              },
              {
                "v": "34.1"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺中市"
              },
              {
                "v": "潭子區"
              },
              {
                "v": "2"
              },
              {
                "v": "-99"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "桃園市"
              },
              {
                "v": "大園區"
              },
              {
                "v": "0"
              },
              {
                "v": "34.1"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "彰化縣"
              },
              {
                "v": "福興鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "32.9"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "高雄市"
              },
              {
                "v": "楠梓區"
              },
              {
                "v": "0"
              },
              {
                "v": "33.1"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "屏東縣"
              },
              {
                "v": "潮州鎮"
              },
              {
                "v": "0"
              },
              {
                "v": "33.7"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "新竹縣"
              },
              {
                "v": "竹東鎮"
              },
              {
                "v": "0"
              },
              {
                "v": "34"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "南投縣"
              },
              {
                "v": "集集鎮"
              },
              {
                "v": "0"
              },
              {
                "v": "33.4"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "桃園市"
              },
              {
                "v": "大溪區"
              },
              {
                "v": "74"
              },
              {
                "v": "33.5"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "新竹縣"
              },
              {
                "v": "尖石鄉"
              },
              {
                "v": "36"
              },
              {
                "v": "28"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺南市"
              },
              {
                "v": "西港區"
              },
              {
                "v": "0"
              },
              {
                "v": "33.3"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "高雄市"
              },
              {
                "v": "苓雅區"
              },
              {
                "v": "0"
              },
              {
                "v": "32.6"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "彰化縣"
              },
              {
                "v": "北斗鎮"
              },
              {
                "v": "0.5"
              },
              {
                "v": "34.3"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺東縣"
              },
              {
                "v": "關山鎮"
              },
              {
                "v": "9"
              },
              {
                "v": "32.3"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺中市"
              },
              {
                "v": "神岡區"
              },
              {
                "v": "0"
              },
              {
                "v": "-99"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "桃園市"
              },
              {
                "v": "平鎮區"
              },
              {
                "v": "0"
              },
              {
                "v": "32.7"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "屏東縣"
              },
              {
                "v": "泰武鄉"
              },
              {
                "v": "20.5"
              },
              {
                "v": "28.6"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "高雄市"
              },
              {
                "v": "桃源區"
              },
              {
                "v": "1.5"
              },
              {
                "v": "31.4"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "嘉義縣"
              },
              {
                "v": "義竹鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "33"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "苗栗縣"
              },
              {
                "v": "獅潭鄉"
              },
              {
                "v": "0.5"
              },
              {
                "v": "32.2"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "雲林縣"
              },
              {
                "v": "大埤鄉"
              },
              {
                "v": "1"
              },
              {
                "v": "33.4"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "彰化縣"
              },
              {
                "v": "田中鎮"
              },
              {
                "v": "9"
              },
              {
                "v": "33.7"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "高雄市"
              },
              {
                "v": "仁武區"
              },
              {
                "v": "0"
              },
              {
                "v": "33.4"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺中市"
              },
              {
                "v": "南屯區"
              },
              {
                "v": "0"
              },
              {
                "v": "33.1"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "新北市"
              },
              {
                "v": "新店區"
              },
              {
                "v": "0"
              },
              {
                "v": "33.6"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "屏東縣"
              },
              {
                "v": "新埤鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "33.9"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺中市"
              },
              {
                "v": "后里區"
              },
              {
                "v": "1.5"
              },
              {
                "v": "-99"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺中市"
              },
              {
                "v": "烏日區"
              },
              {
                "v": "1"
              },
              {
                "v": "33.9"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "彰化縣"
              },
              {
                "v": "芳苑鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "33.6"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "屏東縣"
              },
              {
                "v": "林邊鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "30.6"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "屏東縣"
              },
              {
                "v": "琉球鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "31.1"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺南市"
              },
              {
                "v": "新市區"
              },
              {
                "v": "0"
              },
              {
                "v": "34.6"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "高雄市"
              },
              {
                "v": "橋頭區"
              },
              {
                "v": "0"
              },
              {
                "v": "34.6"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "新北市"
              },
              {
                "v": "中和區"
              },
              {
                "v": "3"
              },
              {
                "v": "34.6"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "屏東縣"
              },
              {
                "v": "麟洛鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "33.7"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺南市"
              },
              {
                "v": "善化區"
              },
              {
                "v": "0"
              },
              {
                "v": "34.4"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "新北市"
              },
              {
                "v": "三芝區"
              },
              {
                "v": "0"
              },
              {
                "v": "32"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "高雄市"
              },
              {
                "v": "三民區"
              },
              {
                "v": "0"
              },
              {
                "v": "32.3"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺南市"
              },
              {
                "v": "佳里區"
              },
              {
                "v": "0"
              },
              {
                "v": "33.4"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "彰化縣"
              },
              {
                "v": "花壇鄉"
              },
              {
                "v": "1"
              },
              {
                "v": "32.7"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "新北市"
              },
              {
                "v": "萬里區"
              },
              {
                "v": "0.5"
              },
              {
                "v": "30.8"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "宜蘭縣"
              },
              {
                "v": "羅東鎮"
              },
              {
                "v": "0"
              },
              {
                "v": "36.3"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "高雄市"
              },
              {
                "v": "杉林區"
              },
              {
                "v": "0"
              },
              {
                "v": "36.2"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺中市"
              },
              {
                "v": "大安區"
              },
              {
                "v": "0"
              },
              {
                "v": "-99"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "金門縣"
              },
              {
                "v": "金寧鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "32.8"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺中市"
              },
              {
                "v": "大肚區"
              },
              {
                "v": "0"
              },
              {
                "v": "31.5"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "雲林縣"
              },
              {
                "v": "北港鎮"
              },
              {
                "v": "0"
              },
              {
                "v": "32.2"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "屏東縣"
              },
              {
                "v": "瑪家鄉"
              },
              {
                "v": "51"
              },
              {
                "v": "30.1"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "高雄市"
              },
              {
                "v": "六龜區"
              },
              {
                "v": "0.5"
              },
              {
                "v": "33.8"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺東縣"
              },
              {
                "v": "金峰鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "32.9"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "高雄市"
              },
              {
                "v": "湖內區"
              },
              {
                "v": "0"
              },
              {
                "v": "32.4"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "新北市"
              },
              {
                "v": "深坑區"
              },
              {
                "v": "0"
              },
              {
                "v": "33.3"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "雲林縣"
              },
              {
                "v": "崙背鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "34.1"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "南投縣"
              },
              {
                "v": "名間鄉"
              },
              {
                "v": "23.5"
              },
              {
                "v": "34"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "彰化縣"
              },
              {
                "v": "埔心鄉"
              },
              {
                "v": "6"
              },
              {
                "v": "32.9"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "連江縣"
              },
              {
                "v": "東引鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "-99"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "花蓮縣"
              },
              {
                "v": "吉安鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "31.4"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "彰化縣"
              },
              {
                "v": "二林鎮"
              },
              {
                "v": "0"
              },
              {
                "v": "32.4"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "桃園市"
              },
              {
                "v": "桃園區"
              },
              {
                "v": "14"
              },
              {
                "v": "33.9"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "高雄市"
              },
              {
                "v": "林園區"
              },
              {
                "v": "0"
              },
              {
                "v": "32.9"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "桃園市"
              },
              {
                "v": "龍潭區"
              },
              {
                "v": "0"
              },
              {
                "v": "32.5"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "新竹縣"
              },
              {
                "v": "關西鎮"
              },
              {
                "v": "6"
              },
              {
                "v": "33.6"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "苗栗縣"
              },
              {
                "v": "南庄鄉"
              },
              {
                "v": "4.5"
              },
              {
                "v": "31.2"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺南市"
              },
              {
                "v": "歸仁區"
              },
              {
                "v": "0"
              },
              {
                "v": "33.5"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "雲林縣"
              },
              {
                "v": "元長鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "33"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺南市"
              },
              {
                "v": "後壁區"
              },
              {
                "v": "0"
              },
              {
                "v": "34.8"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "新北市"
              },
              {
                "v": "新莊區"
              },
              {
                "v": "6"
              },
              {
                "v": "33.4"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺南市"
              },
              {
                "v": "山上區"
              },
              {
                "v": "0"
              },
              {
                "v": "34.2"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺中市"
              },
              {
                "v": "大甲區"
              },
              {
                "v": "0"
              },
              {
                "v": "-99"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "苗栗縣"
              },
              {
                "v": "竹南鎮"
              },
              {
                "v": "0"
              },
              {
                "v": "31.9"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "金門縣"
              },
              {
                "v": "烏坵鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "29.9"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺北市"
              },
              {
                "v": "內湖區"
              },
              {
                "v": "0"
              },
              {
                "v": "34.8"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺中市"
              },
              {
                "v": "太平區"
              },
              {
                "v": "10"
              },
              {
                "v": "31.2"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺南市"
              },
              {
                "v": "安南區"
              },
              {
                "v": "0"
              },
              {
                "v": "32.8"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "嘉義縣"
              },
              {
                "v": "民雄鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "34.8"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺北市"
              },
              {
                "v": "松山區"
              },
              {
                "v": "0.5"
              },
              {
                "v": "34.2"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺東縣"
              },
              {
                "v": "池上鄉"
              },
              {
                "v": "1.5"
              },
              {
                "v": "32.1"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺南市"
              },
              {
                "v": "玉井區"
              },
              {
                "v": "0.5"
              },
              {
                "v": "35.1"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "桃園市"
              },
              {
                "v": "復興區"
              },
              {
                "v": "1"
              },
              {
                "v": "30.6"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "苗栗縣"
              },
              {
                "v": "大湖鄉"
              },
              {
                "v": "28.5"
              },
              {
                "v": "-99"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "基隆市"
              },
              {
                "v": "中正區"
              },
              {
                "v": "0"
              },
              {
                "v": "32.7"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "宜蘭縣"
              },
              {
                "v": "三星鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "33.1"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "彰化縣"
              },
              {
                "v": "埔鹽鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "32.1"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺中市"
              },
              {
                "v": "東勢區"
              },
              {
                "v": "109.5"
              },
              {
                "v": "-99"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "新北市"
              },
              {
                "v": "林口區"
              },
              {
                "v": "12"
              },
              {
                "v": "31.2"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "屏東縣"
              },
              {
                "v": "佳冬鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "33.2"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "雲林縣"
              },
              {
                "v": "莿桐鄉"
              },
              {
                "v": "8.5"
              },
              {
                "v": "32.8"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "南投縣"
              },
              {
                "v": "埔里鎮"
              },
              {
                "v": "0"
              },
              {
                "v": "33.2"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺南市"
              },
              {
                "v": "鹽水區"
              },
              {
                "v": "0"
              },
              {
                "v": "33"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "基隆市"
              },
              {
                "v": "七堵區"
              },
              {
                "v": "0"
              },
              {
                "v": "32.9"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "屏東縣"
              },
              {
                "v": "九如鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "34.4"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "高雄市"
              },
              {
                "v": "鳳山區"
              },
              {
                "v": "0"
              },
              {
                "v": "33.6"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "雲林縣"
              },
              {
                "v": "林內鄉"
              },
              {
                "v": "40"
              },
              {
                "v": "34.2"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "高雄市"
              },
              {
                "v": "彌陀區"
              },
              {
                "v": "0"
              },
              {
                "v": "31.6"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "宜蘭縣"
              },
              {
                "v": "五結鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "33.9"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺南市"
              },
              {
                "v": "北門區"
              },
              {
                "v": "0"
              },
              {
                "v": "31.7"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "苗栗縣"
              },
              {
                "v": "苑裡鎮"
              },
              {
                "v": "0"
              },
              {
                "v": "-99"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "嘉義縣"
              },
              {
                "v": "溪口鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "33"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "新竹縣"
              },
              {
                "v": "寶山鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "32.9"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "屏東縣"
              },
              {
                "v": "東港鎮"
              },
              {
                "v": "0"
              },
              {
                "v": "31.4"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "苗栗縣"
              },
              {
                "v": "西湖鄉"
              },
              {
                "v": "2"
              },
              {
                "v": "-99"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "彰化縣"
              },
              {
                "v": "埤頭鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "33.3"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "彰化縣"
              },
              {
                "v": "竹塘鄉"
              },
              {
                "v": "-99"
              },
              {
                "v": "33.4"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "新北市"
              },
              {
                "v": "土城區"
              },
              {
                "v": "0"
              },
              {
                "v": "33.1"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "彰化縣"
              },
              {
                "v": "線西鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "32"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "嘉義縣"
              },
              {
                "v": "中埔鄉"
              },
              {
                "v": "6"
              },
              {
                "v": "33.3"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "屏東縣"
              },
              {
                "v": "枋寮鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "31.9"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "高雄市"
              },
              {
                "v": "大社區"
              },
              {
                "v": "0"
              },
              {
                "v": "33.5"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "苗栗縣"
              },
              {
                "v": "頭份市"
              },
              {
                "v": "0"
              },
              {
                "v": "33.5"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "高雄市"
              },
              {
                "v": "左營區"
              },
              {
                "v": "0"
              },
              {
                "v": "32"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺南市"
              },
              {
                "v": "七股區"
              },
              {
                "v": "0"
              },
              {
                "v": "31"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "雲林縣"
              },
              {
                "v": "四湖鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "33"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "嘉義縣"
              },
              {
                "v": "朴子市"
              },
              {
                "v": "0"
              },
              {
                "v": "32.6"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "新竹市"
              },
              {
                "v": "香山區"
              },
              {
                "v": "0"
              },
              {
                "v": "32.9"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "嘉義縣"
              },
              {
                "v": "東石鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "31.9"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "高雄市"
              },
              {
                "v": "新興區"
              },
              {
                "v": "0"
              },
              {
                "v": "32.4"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "新竹縣"
              },
              {
                "v": "新豐鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "32.6"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺南市"
              },
              {
                "v": "新營區"
              },
              {
                "v": "0"
              },
              {
                "v": "33.9"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "雲林縣"
              },
              {
                "v": "東勢鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "32.7"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "高雄市"
              },
              {
                "v": "旗山區"
              },
              {
                "v": "0"
              },
              {
                "v": "34.9"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "彰化縣"
              },
              {
                "v": "社頭鄉"
              },
              {
                "v": "11"
              },
              {
                "v": "33.6"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "雲林縣"
              },
              {
                "v": "二崙鄉"
              },
              {
                "v": "0.5"
              },
              {
                "v": "33.2"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "花蓮縣"
              },
              {
                "v": "萬榮鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "33.2"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺中市"
              },
              {
                "v": "新社區"
              },
              {
                "v": "51"
              },
              {
                "v": "-99"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "桃園市"
              },
              {
                "v": "蘆竹區"
              },
              {
                "v": "0"
              },
              {
                "v": "34.9"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "南投縣"
              },
              {
                "v": "水里鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "31.8"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺北市"
              },
              {
                "v": "文山區"
              },
              {
                "v": "0"
              },
              {
                "v": "34.2"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "屏東縣"
              },
              {
                "v": "南州鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "32.3"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "苗栗縣"
              },
              {
                "v": "通霄鎮"
              },
              {
                "v": "0"
              },
              {
                "v": "-99"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "新竹縣"
              },
              {
                "v": "橫山鄉"
              },
              {
                "v": "5"
              },
              {
                "v": "31.7"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "雲林縣"
              },
              {
                "v": "西螺鎮"
              },
              {
                "v": "1.5"
              },
              {
                "v": "33"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "花蓮縣"
              },
              {
                "v": "新城鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "31.6"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "新北市"
              },
              {
                "v": "八里區"
              },
              {
                "v": "2"
              },
              {
                "v": "31.6"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "嘉義縣"
              },
              {
                "v": "番路鄉"
              },
              {
                "v": "6.5"
              },
              {
                "v": "33.9"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "高雄市"
              },
              {
                "v": "小港區"
              },
              {
                "v": "0"
              },
              {
                "v": "32.5"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "苗栗縣"
              },
              {
                "v": "泰安鄉"
              },
              {
                "v": "6.5"
              },
              {
                "v": "28.9"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "高雄市"
              },
              {
                "v": "梓官區"
              },
              {
                "v": "0"
              },
              {
                "v": "32.2"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "苗栗縣"
              },
              {
                "v": "苗栗市"
              },
              {
                "v": "3"
              },
              {
                "v": "-99"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "彰化縣"
              },
              {
                "v": "溪湖鎮"
              },
              {
                "v": "1"
              },
              {
                "v": "33.9"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "金門縣"
              },
              {
                "v": "金沙鎮"
              },
              {
                "v": "0"
              },
              {
                "v": "-99"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺南市"
              },
              {
                "v": "安定區"
              },
              {
                "v": "0"
              },
              {
                "v": "33.9"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "南投縣"
              },
              {
                "v": "鹿谷鄉"
              },
              {
                "v": "5"
              },
              {
                "v": "27.9"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "苗栗縣"
              },
              {
                "v": "三灣鄉"
              },
              {
                "v": "0.5"
              },
              {
                "v": "32.4"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "彰化縣"
              },
              {
                "v": "員林市"
              },
              {
                "v": "9.5"
              },
              {
                "v": "34.4"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺南市"
              },
              {
                "v": "東山區"
              },
              {
                "v": "0"
              },
              {
                "v": "34.7"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺北市"
              },
              {
                "v": "信義區"
              },
              {
                "v": "0.5"
              },
              {
                "v": "34.4"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "連江縣"
              },
              {
                "v": "莒光鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "31"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺南市"
              },
              {
                "v": "麻豆區"
              },
              {
                "v": "0"
              },
              {
                "v": "33.2"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "屏東縣"
              },
              {
                "v": "三地門鄉"
              },
              {
                "v": "3.5"
              },
              {
                "v": "27.8"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "桃園市"
              },
              {
                "v": "中壢區"
              },
              {
                "v": "2"
              },
              {
                "v": "32.1"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "澎湖縣"
              },
              {
                "v": "望安鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "29.6"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺中市"
              },
              {
                "v": "龍井區"
              },
              {
                "v": "0"
              },
              {
                "v": "-99"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "高雄市"
              },
              {
                "v": "岡山區"
              },
              {
                "v": "0"
              },
              {
                "v": "32.9"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "彰化縣"
              },
              {
                "v": "秀水鄉"
              },
              {
                "v": "0.5"
              },
              {
                "v": "32.7"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "桃園市"
              },
              {
                "v": "觀音區"
              },
              {
                "v": "0"
              },
              {
                "v": "33.2"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "嘉義縣"
              },
              {
                "v": "新港鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "33.6"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "屏東縣"
              },
              {
                "v": "霧臺鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "28.4"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺南市"
              },
              {
                "v": "關廟區"
              },
              {
                "v": "0"
              },
              {
                "v": "34.5"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "雲林縣"
              },
              {
                "v": "口湖鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "32"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "新竹縣"
              },
              {
                "v": "新埔鎮"
              },
              {
                "v": "0"
              },
              {
                "v": "32"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺南市"
              },
              {
                "v": "柳營區"
              },
              {
                "v": "0"
              },
              {
                "v": "34.9"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "苗栗縣"
              },
              {
                "v": "銅鑼鄉"
              },
              {
                "v": "7.5"
              },
              {
                "v": "-99"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺中市"
              },
              {
                "v": "外埔區"
              },
              {
                "v": "0"
              },
              {
                "v": "-99"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺中市"
              },
              {
                "v": "大雅區"
              },
              {
                "v": "0"
              },
              {
                "v": "31"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺東縣"
              },
              {
                "v": "綠島鄉"
              },
              {
                "v": "1.5"
              },
              {
                "v": "31.4"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "高雄市"
              },
              {
                "v": "路竹區"
              },
              {
                "v": "0"
              },
              {
                "v": "32.6"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "嘉義縣"
              },
              {
                "v": "鹿草鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "33.5"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "高雄市"
              },
              {
                "v": "內門區"
              },
              {
                "v": "0"
              },
              {
                "v": "33.9"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "新竹縣"
              },
              {
                "v": "湖口鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "31.5"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "高雄市"
              },
              {
                "v": "茄萣區"
              },
              {
                "v": "0"
              },
              {
                "v": "31.9"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "宜蘭縣"
              },
              {
                "v": "冬山鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "33.6"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "彰化縣"
              },
              {
                "v": "田尾鄉"
              },
              {
                "v": "3.5"
              },
              {
                "v": "33.8"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "屏東縣"
              },
              {
                "v": "里港鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "33.3"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "屏東縣"
              },
              {
                "v": "長治鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "34.3"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "宜蘭縣"
              },
              {
                "v": "壯圍鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "33.8"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "嘉義縣"
              },
              {
                "v": "布袋鎮"
              },
              {
                "v": "0"
              },
              {
                "v": "32.4"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "南投縣"
              },
              {
                "v": "竹山鎮"
              },
              {
                "v": "95"
              },
              {
                "v": "34.4"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "高雄市"
              },
              {
                "v": "田寮區"
              },
              {
                "v": "0"
              },
              {
                "v": "33.2"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "屏東縣"
              },
              {
                "v": "鹽埔鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "33.8"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺東縣"
              },
              {
                "v": "臺東市"
              },
              {
                "v": "0.5"
              },
              {
                "v": "33"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "南投縣"
              },
              {
                "v": "中寮鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "32.9"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺南市"
              },
              {
                "v": "龍崎區"
              },
              {
                "v": "-99"
              },
              {
                "v": "33"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "苗栗縣"
              },
              {
                "v": "三義鄉"
              },
              {
                "v": "8.5"
              },
              {
                "v": "-99"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "新北市"
              },
              {
                "v": "永和區"
              },
              {
                "v": "1.5"
              },
              {
                "v": "33.9"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "屏東縣"
              },
              {
                "v": "來義鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "33.9"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "新竹縣"
              },
              {
                "v": "峨眉鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "33.6"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "新北市"
              },
              {
                "v": "蘆洲區"
              },
              {
                "v": "3.5"
              },
              {
                "v": "33.3"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "新北市"
              },
              {
                "v": "三重區"
              },
              {
                "v": "0"
              },
              {
                "v": "33.5"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "新竹縣"
              },
              {
                "v": "五峰鄉"
              },
              {
                "v": "1.5"
              },
              {
                "v": "20.5"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺東縣"
              },
              {
                "v": "東河鄉"
              },
              {
                "v": "6.5"
              },
              {
                "v": "30.3"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "新北市"
              },
              {
                "v": "貢寮區"
              },
              {
                "v": "0"
              },
              {
                "v": "33.5"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "嘉義市"
              },
              {
                "v": "東區"
              },
              {
                "v": "3.5"
              },
              {
                "v": "34.5"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "新北市"
              },
              {
                "v": "石門區"
              },
              {
                "v": "0"
              },
              {
                "v": "31"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺東縣"
              },
              {
                "v": "鹿野鄉"
              },
              {
                "v": "7.5"
              },
              {
                "v": "31.5"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "屏東縣"
              },
              {
                "v": "枋山鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "33"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺東縣"
              },
              {
                "v": "卑南鄉"
              },
              {
                "v": "8"
              },
              {
                "v": "30.1"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "宜蘭縣"
              },
              {
                "v": "礁溪鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "30.1"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "嘉義縣"
              },
              {
                "v": "竹崎鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "26"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "新北市"
              },
              {
                "v": "金山區"
              },
              {
                "v": "1"
              },
              {
                "v": "30.2"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺北市"
              },
              {
                "v": "北投區"
              },
              {
                "v": "1.5"
              },
              {
                "v": "-99"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺東縣"
              },
              {
                "v": "成功鎮"
              },
              {
                "v": "1"
              },
              {
                "v": "31"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "南投縣"
              },
              {
                "v": "南投市"
              },
              {
                "v": "29"
              },
              {
                "v": "35.8"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "屏東縣"
              },
              {
                "v": "春日鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "34.6"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "屏東縣"
              },
              {
                "v": "車城鄉"
              },
              {
                "v": "1"
              },
              {
                "v": "34.8"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "花蓮縣"
              },
              {
                "v": "瑞穗鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "33.4"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "花蓮縣"
              },
              {
                "v": "光復鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "35.8"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "新北市"
              },
              {
                "v": "汐止區"
              },
              {
                "v": "0"
              },
              {
                "v": "28.7"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "桃園市"
              },
              {
                "v": "龜山區"
              },
              {
                "v": "25"
              },
              {
                "v": "32.2"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "新北市"
              },
              {
                "v": "坪林區"
              },
              {
                "v": "0"
              },
              {
                "v": "32.2"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "雲林縣"
              },
              {
                "v": "臺西鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "31"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "新北市"
              },
              {
                "v": "雙溪區"
              },
              {
                "v": "0"
              },
              {
                "v": "34.8"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺東縣"
              },
              {
                "v": "大武鄉"
              },
              {
                "v": "1"
              },
              {
                "v": "31.1"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺東縣"
              },
              {
                "v": "長濱鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "33.3"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "嘉義縣"
              },
              {
                "v": "大埔鄉"
              },
              {
                "v": "5.5"
              },
              {
                "v": "32.9"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "苗栗縣"
              },
              {
                "v": "後龍鎮"
              },
              {
                "v": "1.5"
              },
              {
                "v": "-99"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "南投縣"
              },
              {
                "v": "信義鄉"
              },
              {
                "v": "1.5"
              },
              {
                "v": "27.3"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺東縣"
              },
              {
                "v": "蘭嶼鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "31.5"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "雲林縣"
              },
              {
                "v": "水林鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "34.1"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "屏東縣"
              },
              {
                "v": "萬巒鄉"
              },
              {
                "v": "1"
              },
              {
                "v": "34.9"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "高雄市"
              },
              {
                "v": "甲仙區"
              },
              {
                "v": "2"
              },
              {
                "v": "33.6"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "高雄市"
              },
              {
                "v": "茂林區"
              },
              {
                "v": "9"
              },
              {
                "v": "33.9"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "雲林縣"
              },
              {
                "v": "虎尾鎮"
              },
              {
                "v": "5.5"
              },
              {
                "v": "33.7"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "新北市"
              },
              {
                "v": "烏來區"
              },
              {
                "v": "3.5"
              },
              {
                "v": "32.2"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺東縣"
              },
              {
                "v": "海端鄉"
              },
              {
                "v": "1"
              },
              {
                "v": "22.7"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "雲林縣"
              },
              {
                "v": "古坑鄉"
              },
              {
                "v": "105"
              },
              {
                "v": "34.5"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "花蓮縣"
              },
              {
                "v": "豐濱鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "30.5"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "宜蘭縣"
              },
              {
                "v": "員山鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "33.3"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "花蓮縣"
              },
              {
                "v": "富里鄉"
              },
              {
                "v": "3.5"
              },
              {
                "v": "32.7"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "新北市"
              },
              {
                "v": "瑞芳區"
              },
              {
                "v": "0"
              },
              {
                "v": "32.5"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "花蓮縣"
              },
              {
                "v": "鳳林鎮"
              },
              {
                "v": "0"
              },
              {
                "v": "33.5"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "屏東縣"
              },
              {
                "v": "獅子鄉"
              },
              {
                "v": "2.5"
              },
              {
                "v": "32.5"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺南市"
              },
              {
                "v": "白河區"
              },
              {
                "v": "8"
              },
              {
                "v": "32.3"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "花蓮縣"
              },
              {
                "v": "玉里鎮"
              },
              {
                "v": "0"
              },
              {
                "v": "34.2"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "屏東縣"
              },
              {
                "v": "滿州鄉"
              },
              {
                "v": "20.5"
              },
              {
                "v": "31.2"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺北市"
              },
              {
                "v": "士林區"
              },
              {
                "v": "0"
              },
              {
                "v": "31.5"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "花蓮縣"
              },
              {
                "v": "卓溪鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "35.2"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺東縣"
              },
              {
                "v": "達仁鄉"
              },
              {
                "v": "0.5"
              },
              {
                "v": "27.4"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "嘉義縣"
              },
              {
                "v": "阿里山鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "28.1"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "宜蘭縣"
              },
              {
                "v": "頭城鎮"
              },
              {
                "v": "0"
              },
              {
                "v": "25.8"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "屏東縣"
              },
              {
                "v": "恆春鎮"
              },
              {
                "v": "10.5"
              },
              {
                "v": "31.1"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "宜蘭縣"
              },
              {
                "v": "南澳鄉"
              },
              {
                "v": "0.5"
              },
              {
                "v": "25"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺東縣"
              },
              {
                "v": "太麻里鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "33"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "花蓮縣"
              },
              {
                "v": "壽豐鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "27.5"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "屏東縣"
              },
              {
                "v": "牡丹鄉"
              },
              {
                "v": "23"
              },
              {
                "v": "33.1"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "南投縣"
              },
              {
                "v": "仁愛鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "18.3"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "宜蘭縣"
              },
              {
                "v": "大同鄉"
              },
              {
                "v": "0.5"
              },
              {
                "v": "19.9"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "臺中市"
              },
              {
                "v": "和平區"
              },
              {
                "v": "0"
              },
              {
                "v": "19.8"
              },
              {
                "v": "第一天"
              }
            ]
          },
          {
            "c": [
              {
                "v": "花蓮縣"
              },
              {
                "v": "秀林鄉"
              },
              {
                "v": "0"
              },
              {
                "v": "30.3"
              },
              {
                "v": "第一天"
              }
            ]
          }
        ],
        "parsedNumHeaders": 0
      }
    }
    )
    const params = new HttpParams()
      .append('Authorization', 'CWB-58C1E113-D5B9-45A0-9295-BB080D302D68')
      .append('elementName', 'H_24R')
      .append('elementName', 'D_TX')
    return this.httpclient.get<WeatherData>('https://opendata.cwb.gov.tw/api/v1/rest/datastore/O-A0001-001', { params: params }).pipe(
      this.convertWeatherApiToDistrictGraphData,
      this.filterMalfunctionStation,
      this.averageHeightInDuplicateDistrict,
      this.averageToneInDuplicateDistrict,
      this.filterDuplicatedDistrict,
    )
  }

  averageHeightInDuplicateDistrict = map((districts: DistrictGraphData[]): DistrictGraphData[] => {
    const recordDistricts: DistrictGraphData[] = []
    districts.map(currentDistrict => {
      const sameDistrictsInRecord = recordDistricts.filter(record => record.districtName === currentDistrict.districtName && record.cityName === currentDistrict.cityName)
      if (sameDistrictsInRecord !== undefined) {
        // has duplicated district
        const avgHeight = this.getAverageHeight([...sameDistrictsInRecord, currentDistrict])
        sameDistrictsInRecord.forEach(district => { district.height = avgHeight })
        currentDistrict.height = avgHeight
        recordDistricts.push(currentDistrict)
      } else {
        recordDistricts.push(currentDistrict)
      }
    })
    return recordDistricts
  })

  averageToneInDuplicateDistrict = map((districts: DistrictGraphData[]): DistrictGraphData[] => {
    const recordDistrict: DistrictGraphData[] = []
    districts.map(currentDistrict => {
      const sameDistrictsInRecord = recordDistrict.filter(record => record.districtName === currentDistrict.districtName && record.cityName === currentDistrict.cityName)
      if (sameDistrictsInRecord !== undefined) {
        const avgTone = this.getAverageTone([...sameDistrictsInRecord, currentDistrict])
        sameDistrictsInRecord.forEach(district => { district.tone = avgTone })
        currentDistrict.tone = avgTone
        recordDistrict.push(currentDistrict)
      } else {
        recordDistrict.push(currentDistrict)
      }
    })
    return recordDistrict
  })

  filterDuplicatedDistrict = map((districts: DistrictGraphData[]): DistrictGraphData[] => {
    let recordDistricts: DistrictGraphData[] = []
    districts.forEach(currentDistrict => {
      const foundDuplicate = recordDistricts.some(recordDistrict => {
        return recordDistrict.cityName === currentDistrict.cityName && recordDistrict.districtName === currentDistrict.districtName
      })
      foundDuplicate ? '' : recordDistricts.push(currentDistrict)
    })
    return recordDistricts
  })

  getGoogleSheetInfo = (googeSheetId: string = '1ydqYElUX25OfRwThdtlFLFN_Opww7tAUebjIcj_bX1Q'): Observable<DistrictGraphData[]> => {
    console.log('googeSheetId: ', googeSheetId);

    // @ts-ignore
    return this.httpclient.get<GoogleSheetRawData>(`https://docs.google.com/spreadsheets/d/${googeSheetId}/gviz/tq?`).pipe(
      this.convertGoogleSheetToDistrictGraphData,
      this.filterMalfunctionStation,
      this.averageHeightInDuplicateDistrict,
      this.averageToneInDuplicateDistrict,
      this.filterDuplicatedDistrict,
    )
  }

  getMapDataFromFirebase = (mapId: string): Observable<MapInfoInFirebase> => {
    return this.db.list('maps').valueChanges().pipe(map((mapsInfo: any[]): MapInfoInFirebase => {
      return (<MapInfoInFirebase[]>mapsInfo).filter(map => map.mapUrl === mapId)[0]
    }))
  }

  getAllMapsFromFirebase = (): Observable<MapInfoInFirebase[]> => {
    return <Observable<MapInfoInFirebase[]>>this.db.list('maps').valueChanges()
  }

  convertWeatherApiToDistrictGraphData = map((next: WeatherData): DistrictGraphData[] => {
    return next.records.location.map(station => {
      const rainValue = this.findWeatherValue(station, 'H_24R')
      const topTempValue = this.findWeatherValue(station, 'D_TX')
      const district = this.findLocationValue(station, 'TOWN')
      const city = this.findLocationValue(station, 'CITY')
      return {
        cityName: city,
        districtName: district,
        height: +rainValue,
        tone: +topTempValue,
        meshText: undefined
      }
    })
  })

  convertGoogleSheetToDistrictGraphData = map((next): DistrictGraphData[] => {
    console.log('Google Sheet Rawdata', next);
    let count = 0

    const raw = <GoogleSheetRawData>next
    const firstRow = raw.table.rows[0].c
    // const zhCityColumnIndex = firstRow.findIndex(cell => cell.v === '縣市')
    // const zhDistrictColumnIndex = firstRow.findIndex(cell => cell.v === "行政區")
    // const heightColumnIndex = firstRow.findIndex(cell => cell.v === "高度")
    // const toneColumnIndex = firstRow.findIndex(cell => cell.v === "色調")
    // const timelineColumnIndex = firstRow.findIndex(cell => cell.v === "時間軸")
    const districtsGraphData: DistrictGraphData[] = raw.table.rows
      .filter((row, index) => row.c[0].v !== '縣市')
      .map((row, index) => {
        let cityName = ""
        let districtName = ""
        let height = 0
        let tone = 0
        let meshText: meshText = {
          title: "",
          subtitle: "",
          description: "",
        }
        if (row.c) {

          if (row.c[0]) {
            if (row.c[0].v && row.c[0].v !== '#N/A') {
              cityName = row.c[0].v
              cityName = cityName.replace("台", "臺")
              if (cityName === "桃園縣") {
                cityName = "桃園市"
                console.warn(`桃園縣已升格為直轄市，故修改為桃園市`);
              }
              if (cityName === "臺北縣") {
                cityName = "新北市"
                console.warn(`臺北縣已升格為直轄市，故修改為新北市`);
              }
            } else {
              alert(`匯入表單時，發現第${index + 1}行的縣市名稱出現錯誤！`)
            }
          } else {
            alert(`匯入表單時，發現第${index + 1}行的縣市名稱出現錯誤！請確定有填上值`)
          }

          if (row.c[1]) {
            if (row.c[0].v && row.c[0].v !== '#N/A') {
              districtName = row.c[1].v
              districtName = districtName.replace("台", "臺")
              if (districtName === "頭份鎮") {
                districtName = "頭份市"
                console.warn(`桃園縣已升格為直轄市，故修改為桃園市`);
              }
              if (districtName === "員林鎮") {
                districtName = "員林市"
                console.warn(`員林鎮已升格為縣轄市，故修改為員林市`);
              }
              if (districtName === "峨嵋鄉") {
                districtName = "峨眉鄉"
                console.warn(`峨嵋鄉為峨眉鄉的別稱，統一改成峨眉鄉`);
              }
              if (districtName === "通宵鎮") {
                districtName = "通霄鎮"
                console.warn(`通宵鎮為通霄鎮的別稱，統一改成通霄鎮`);
              }
              if (districtName === "溪洲鄉") {
                districtName = "溪州鄉"
                console.warn(`溪州鄉為溪洲鄉的別稱，統一改成溪州鄉`);
              }
              if (districtName.includes("東沙")) {
                alert(`匯入表單時，發現有東沙環礁，目前不支援東沙環礁的資料呈現，請在Google表單請移除該筆資料`)
              }
              if (districtName === "南沙") {
                alert(`匯入表單時，發現有南沙環礁，目前不支援東沙環礁的資料呈現，請在Google表單請移除該筆資料`)
              }
            } else {
              alert(`匯入表單時，發現第${index + 1}行的鄉鎮市區名稱出現錯誤！`)
            }
          } else {
            alert(`匯入表單時，發現第${index + 1}行的鄉鎮市區名稱出現錯誤！請確定有填上值`)
          }


          if (row.c[2]) {
            if (row.c[2].v !== undefined) {
              if (isNaN(parseFloat(row.c[2].v))) {
                height = -99
                alert(`匯入表單時發現${row.c[0].v}${row.c[1].v}的高度資料不是數字`)
              } else {
                height = +row.c[2].v
              }
            } else {
              alert(`匯入表單時，發現第${index + 1}行的高度資料出現錯誤！`)
            }
          } else {
            alert(`匯入表單時，發現第${index + 1}行的高度資料出現錯誤！請確定有填上值`)
          }


          if (row.c[3]) {
            if (row.c[3].v !== undefined) {
              if (isNaN(parseFloat(row.c[3].v))) {
                tone = -99
                alert(`匯入表單時發現${row.c[0].v}${row.c[1].v}的色調資料不是數字`)
              } else {
                tone = +row.c[3].v
              }
            } else {
              alert(`匯入表單時，發現第${index + 1}行的色調資料出現錯誤！`)
            }
          } else {
            alert(`匯入表單時，發現第${index + 1}行的色調資料出現錯誤！請確定有填上值`)
          }


          if (row.c[4]) {
            if (row.c[4].v) {
              // meshText = row.c[4].v
            } else {
              alert(`匯入表單時，發現第${index}行的縣市名稱出現錯誤！`)
            }
          } else {
            alert(`匯入表單時，發現第${index}行的縣市名稱出現錯誤！請確定有填上值`)
          }
        } else {
          alert(`匯入表單時，發現第${index}行出現錯誤！`)
        }
        return {
          cityName,
          districtName,
          height,
          tone,
          meshText,
        }
      })
    console.log(districtsGraphData);

    return districtsGraphData
  })

  filterMalfunctionStation = map((graphsData: DistrictGraphData[]): DistrictGraphData[] => {
    // filterMalfunctionStation = map((value: WeatherData): WeatherData => {
    const functioningStations = graphsData.filter(station => {
      const isRainMalfunction = station.height === -99
      const isHighestTempMalfunction = station.tone === -99
      const isMalfunction = isHighestTempMalfunction || isRainMalfunction
      if (isMalfunction) {
        console.log(`站台 ${JSON.stringify(station)} 運作不正常`);

      }
      return !isMalfunction
    })
    return functioningStations
  })

  getAverageHeight = (districts: DistrictGraphData[]): number => {
    let sumHeight = 0
    districts.forEach(district => {
      sumHeight += +district.height
    })
    return sumHeight / districts.length
  }

  getAverageTone = (districts: DistrictGraphData[]): number => {
    let sumTone = 0
    districts.forEach(district => {
      sumTone += +district.tone
    })
    return (sumTone / districts.length)
  }

}
