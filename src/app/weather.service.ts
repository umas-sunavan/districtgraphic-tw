import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpRequest } from '@angular/common/http';
import { concat, forkJoin, Observable, of } from 'rxjs';
import { concatMap, flatMap, map, mergeMap, tap } from 'rxjs/operators';
import { enZhMapping } from './en-zh-mapping';
import { EnZhMap, WeatherData, ApiWeatherData, Location as ApiLocation, DistrictWeatherInfo, DistrictGraphData, googleSheetRawData as GoogleSheetRawData, MapInfoInFirebase, MapAttributeForm, ToneGradient, MapSource, meshText, WeatherForcastData, ForcastLocation, DistrictMeshData } from './interfaces';
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

  getWeatherInfo = ():Observable<DistrictGraphData[]> => {
    const url = 'https://opendata.cwb.gov.tw/api/v1/rest/datastore/O-A0001-001'
    const params = new HttpParams()
      .append('Authorization', 'CWB-58C1E113-D5B9-45A0-9295-BB080D302D68')
      .append('elementName', 'H_24R')
      .append('elementName', 'D_TX')
    const infoObservable: Observable<DistrictGraphData[]> = this.httpclient.get<WeatherData>(url, { params: params }).pipe(
      this.convertWeatherApiToDistrictGraphData,
      this.filterMalfunctionStation,
      this.averageHeightInDuplicateDistrict,
      this.averageToneInDuplicateDistrict,
      this.filterDuplicatedDistrict,
    )
    return infoObservable
  }

  getWeatherForcast = (): Observable<DistrictGraphData[]> => {
    const getCityForcasts: Observable<DistrictGraphData[]>[] = [
      this.getCityForcast('003'), // 宜蘭縣
      this.getCityForcast('007'), // 桃園市
      this.getCityForcast('011'), // 新竹縣
      this.getCityForcast('015'), // 苗栗縣
      this.getCityForcast('019'), // 彰化縣
      this.getCityForcast('023'), // 南投縣
      this.getCityForcast('027'), // 雲林縣
      this.getCityForcast('031'), // 嘉義縣
      this.getCityForcast('035'), // 屏東縣
      this.getCityForcast('039'), // 臺東縣
      this.getCityForcast('043'), // 花蓮縣
      this.getCityForcast('047'), // 澎湖縣
      this.getCityForcast('051'), // 基隆縣
      this.getCityForcast('055'), // 新竹市
      this.getCityForcast('059'), // 嘉義市
      this.getCityForcast('063'), // 臺北市
      this.getCityForcast('067'), // 高雄市
      this.getCityForcast('071'), // 新北市
      this.getCityForcast('075'), // 臺中市
      this.getCityForcast('079'), // 臺南市
      this.getCityForcast('083'), // 連江市
      this.getCityForcast('087'), // 金門市
    ]
    return forkJoin(getCityForcasts).pipe(
      map(cities => {
        // @ts-ignore
        const allForcast: DistrictGraphData[] = cities.flat()
        return allForcast
      })
    )

  }

  getCityForcast = (cityCode: string): Observable<DistrictGraphData[]> => {
    const url = `https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-${cityCode}`
    const params = new HttpParams()
      .append('Authorization', 'CWB-58C1E113-D5B9-45A0-9295-BB080D302D68')
      .append('elementName', 'WeatherDescription')
    return this.httpclient.get<WeatherForcastData>(url, { params: params })
      .pipe(this.convertCloudForcastToDistrictGraphData)
  }

  convertCloudForcastToDistrictGraphData = map(((raw: WeatherForcastData): DistrictGraphData[] => {
    const forcastLocations: ForcastLocation[] = raw.records.locations[0].location
    const locations: ApiLocation[] = this.converForcastLocations(forcastLocations)
    const districtGraphDatas: DistrictGraphData[] = locations.map(location => {
      const matchedRainRates: string[] = location.weatherElement[0].elementValue.match(/降雨機率 \d+/g) || ['-99']
      const matchedRainRate: string = matchedRainRates[0].replace('降雨機率 ', '')
      const matchedWinds: string[] = location.weatherElement[0].elementValue.match(/級\(每秒\d+/g) || ['-99']
      const matchedWind: string = matchedWinds[0].replace('級\(每秒', '')
      return {
        cityName: raw.records.locations[0].locationsName,
        districtName: location.locationName,
        height: +matchedWind,
        tone: +matchedRainRate,
      }
    })
    return districtGraphDatas
  }))

  converForcastLocations = (forcastLocations: ForcastLocation[]) => {
    const locations: ApiLocation[] = forcastLocations.map(forcastLocation => {
      return {
        lat: forcastLocation.lat,
        locationName: forcastLocation.locationName,
        lon: forcastLocation.lon,
        parameter: [
          { parameterName: 'datasetDescription', parameterValue: 'String' }
        ],
        stationId: '0',
        time: {},
        weatherElement: [{
          elementName: forcastLocation.weatherElement[0].time[0].elementValue[0].measures,
          elementValue: forcastLocation.weatherElement[0].time[0].elementValue[0].value
        }]
      }
    })
    return locations
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
    return this.db.list('maps').valueChanges().pipe(
      this.addWeatherMap(),
      this.addCloudMap(),
      map((mapsInfo: any[]): MapInfoInFirebase => {
        return (<MapInfoInFirebase[]>mapsInfo).filter(map => map.mapUrl === mapId)[0]
      }))
  }

  getAllMapsFromFirebase = (): Observable<MapInfoInFirebase[]> => {
    return <Observable<MapInfoInFirebase[]>>this.db.list('maps').valueChanges().pipe(
      this.addWeatherMap(),
      this.addCloudMap()
    )
  }

  addWeatherMap = () => map((maps: any[]): MapInfoInFirebase[] => {  
    const weatherInfo: MapInfoInFirebase = {
      HeightDimensionTitle: '今日降雨量',
      HeightDimensionUnit: '毫米',
      MaxToneHex: 'EEF588',
      MinToneHex: '70a7f3',
      ToneDimensionTitle: '本日最高溫',
      ToneDimensionUnit: '度C',
      author: '伍瑪斯',
      authorEmail: 'fareastsunflower@gmail.com',
      mapName: '台灣天氣資訊地圖',
      mapUrl: 'weather',
      sourceData: 'https://opendata.cwb.gov.tw/dist/opendata-swagger.html',
      sourceUrl: 'https://opendata.cwb.gov.tw/dist/opendata-swagger.html',
      createDate: new Date(),
      requireHeightDimension: 'true',
      requireToneDimension: 'true',
      mapDescription: "透過氣象局Opendata，能夠取得每小時更新一次的氣象資料\n顏色代表每小時最高溫度，高度代表每小時降雨量\n資料來源是氣象局提供的資料唷！",
      liveStream: 'true'
    }
    maps.push(weatherInfo)
    return maps
  })

  addCloudMap = () => map((maps: any[]): MapInfoInFirebase[] => {
    const weatherInfo: MapInfoInFirebase = {
      HeightDimensionTitle: '風速',
      HeightDimensionUnit: '公尺/秒',
      MaxToneHex: 'EEF588',
      MinToneHex: '70a7f3',
      ToneDimensionTitle: '降雨機率',
      ToneDimensionUnit: '%',
      author: '伍瑪斯',
      authorEmail: 'fareastsunflower@gmail.com',
      mapName: '台灣即時雲圖',
      mapUrl: 'cloud',
      sourceData: 'https://opendata.cwb.gov.tw/dist/opendata-swagger.html',
      sourceUrl: 'https://opendata.cwb.gov.tw/dist/opendata-swagger.html',
      createDate: new Date(),
      requireHeightDimension: 'true',
      requireToneDimension: 'true',
      mapDescription: "透過氣象局Opendata，能夠取得每小時更新一次的氣象資料\n顏色代表每小時最高溫度，高度代表每小時降雨量\n資料來源是氣象局提供的資料唷！",
      liveStream: 'true'
    }
    maps.push(weatherInfo)
    return maps
  })

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

  convertCloudReportToDistrictGraphData = map((next: WeatherData): DistrictGraphData[] => {
    return next.records.location.map(station => {
      const weatherDescription: string = this.findWeatherValue(station, 'Weather')
      const weatherCode: number = weatherDescription.includes('晴') ? 3 : weatherDescription.includes('多雲') ? 2 : weatherDescription.includes('陰') ? 1 : 0
      const uvi = this.findWeatherValue(station, 'H_UVI')
      const district = this.findLocationValue(station, 'TOWN')
      const city = this.findLocationValue(station, 'CITY')
      return {
        cityName: city,
        districtName: district,
        height: 0,
        tone: +weatherCode,
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
