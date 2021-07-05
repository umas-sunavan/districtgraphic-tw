export interface ApiWeatherData {
    rainValue: string;
    topTempValue: string;
    district: string;
    city: string
  }
  
  export interface Location {
    lat: string,
    locationName: string,
    lon: string,
    parameter: { parameterName: string, parameterValue: string }[],
    stationId: string,
    time: {},
    weatherElement: { elementName: string, elementValue: string }[]
  }
  
  export interface WeatherData {
    success: string,
    result: {}[],
    records: { location: Location[] },
  }
  
  export interface EnZhMap {
    enDistrict: string,
    zhDistrict: string,
    enCity: string,
    zhCity: string
  }


  
  export interface DistrictWeatherInfo {
    rainValue: string;
    topTempValue: string;
    district: string;
    enDistrictAndCity:string
    city: string;
    enCity:string,
    color: {r:number, g:number, b:number}
  }