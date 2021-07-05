import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { enZhMapping } from './en-zh-mapping';
import { EnZhMap, WeatherData, ApiWeatherData, Location as ApiLocation, DistrictWeatherInfo } from './interfaces';

@Injectable({
  providedIn: 'root'
})

export class WeatherService {

  constructor(
    private httpclient: HttpClient
  ) {

  }

  // names we can find in the 3D model
  districtsEnZhMap: EnZhMap[] = enZhMapping


  checkMissedDistrict = tap((value: WeatherData) => {    
    this.districtsEnZhMap.forEach(districtMap => {
      const mappedDistrict = value.records.location.find(location => {
        const waetherDistrictName = location.parameter.find(param => param.parameterName === 'TOWN')?.parameterValue
        const waetherCityName = location.parameter.find(param => param.parameterName === 'CITY')?.parameterValue
        const sameDistrictName = districtMap.zhDistrict === waetherDistrictName
        const sameCityName = districtMap.zhCity === waetherCityName
        return sameDistrictName && sameCityName
      })
      if (!mappedDistrict) {
        console.log(`No station in ${districtMap.zhCity}, ${districtMap.zhDistrict}`);
      }
    })
  })

  filterMalfunctionStation = map((value: WeatherData): WeatherData => {
    const functioningStations = value.records.location.filter(station => {
      const isRainMalfunction = station.weatherElement.find(element => element.elementName === 'H_24R')?.elementValue === '-99'
      const isHighestTempMalfunction = station.weatherElement.find(element => element.elementName === 'D_TX')?.elementValue === '-99'
      const isMalfunction = isHighestTempMalfunction || isRainMalfunction
      if (isMalfunction) {
        console.log('Malfunctioned station: ', station.locationName, station.parameter.find(parameter => parameter.parameterName === 'CITY')?.parameterValue, station.parameter.find(parameter => parameter.parameterName === 'TOWN')?.parameterValue);
      }
      return !isMalfunction
    })
    value.records.location = functioningStations
    return value
  })

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

  extractDemandingInfo = map((value: WeatherData): ApiWeatherData[] => {
    const demandingInfo = value.records.location.map(station => {
      const rainValue = this.findWeatherValue(station, 'H_24R')
      const topTempValue = this.findWeatherValue(station, 'D_TX')
      const district = this.findLocationValue(station, 'TOWN')
      const city = this.findLocationValue(station, 'CITY')
      return { rainValue, topTempValue, district, city }
    })
    return demandingInfo
  })

  averageDuplicatedRainning = map((districtsInfo: ApiWeatherData[]): ApiWeatherData[] => {
    const recordDistrict: ApiWeatherData[] = []
    districtsInfo.map(districtInfo => {
      const recordedDistricts = recordDistrict.filter(record => record.district === districtInfo.district && record.city === districtInfo.city)
      if (recordedDistricts !== undefined) {
        const averageRain = this.getAverageRainValue([...recordedDistricts, districtInfo])
        recordedDistricts.forEach(district => { district.rainValue = averageRain })
        districtInfo.rainValue = averageRain
        recordDistrict.push(districtInfo)
      } else {
        recordDistrict.push(districtInfo)
      }
    })
    return recordDistrict
  })

  averageDuplicatedHighestTemp = map((districtsInfo: ApiWeatherData[]): ApiWeatherData[] => {
    const recordDistrict: ApiWeatherData[] = []
    districtsInfo.map(districtInfo => {
      const recordedDuplicates = recordDistrict.filter(record => record.district === districtInfo.district && record.city === districtInfo.city)
      if (recordedDuplicates !== undefined) {
        const topTemp = this.getAverageHighestTempValue([...recordedDuplicates, districtInfo])
        recordedDuplicates.forEach(district => { district.topTempValue = topTemp })
        districtInfo.topTempValue = topTemp
        recordDistrict.push(districtInfo)
      } else {
        recordDistrict.push(districtInfo)
      }
    })
    return recordDistrict
  })

  filterDuplicatedDistrict = map((districtsInfo: ApiWeatherData[]): ApiWeatherData[] => {
    const checkDuplicates: ApiWeatherData[] = []
    districtsInfo.forEach(district => {
      const duplicated = checkDuplicates.some(pushedDistrict => {
        return district.district === pushedDistrict.district && district.city === pushedDistrict.city
      })
      duplicated ? '' : checkDuplicates.push(district)
    })
    return checkDuplicates
  })

  changeObjType = map((weatherInDistricts: ApiWeatherData[]): DistrictWeatherInfo[] => {
    const weatherInfo = weatherInDistricts.map(weatherInDistricts => {
      return { ...weatherInDistricts, color: { r: 0, g: 0, b: 0 }, enCity: '', enDistrictAndCity: '' }
    })
    return weatherInfo
  })

  getWeatherInfo = (): Observable<DistrictWeatherInfo[]> => {
    const params = new HttpParams()
      .append('Authorization', 'CWB-58C1E113-D5B9-45A0-9295-BB080D302D68')
      .append('elementName', 'H_24R')
      .append('elementName', 'D_TX')
    return this.httpclient.get<WeatherData>('https://opendata.cwb.gov.tw/api/v1/rest/datastore/O-A0001-001', { params: params }).pipe(
      this.checkMissedDistrict,
      this.filterMalfunctionStation,
      this.extractDemandingInfo,
      this.averageDuplicatedRainning,
      this.averageDuplicatedHighestTemp,
      this.filterDuplicatedDistrict,
      this.changeObjType,
    )
  }

  getAverageRainValue = (districts: ApiWeatherData[]): string => {
    let sumRain = 0
    districts.forEach(district => {
      sumRain += +district.rainValue
    })
    return sumRain / districts.length + ''
  }

  getAverageHighestTempValue = (districts: ApiWeatherData[]): string => {
    let sumTemp = 0
    districts.forEach(district => {
      sumTemp += +district.topTempValue
    })
    return (sumTemp / districts.length) + ''
  }


}
