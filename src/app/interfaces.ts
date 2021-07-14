import { Mesh } from "three";

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
  enDistrictAndCity: string
  city: string;
  enCity: string,
  color: { r: number, g: number, b: number }
}

export interface DistrictGraphData {
  cityName: string,
  districtName: string,
  height: number,
  tone: number,
  meshText?: meshText
}

export interface meshText {
  title: string,
  subtitle: string,
  description: string,
}

export interface DistrictMeshData {
  meshName: string,
  zhCityName: string,
  enCityName: string,
  zhDistrictName: string,
  enDistrictName: string,
  mesh3d: Mesh,
  tone: number,
  height: number,
  rgbColor: { r: number, g: number, b: number },
}

export interface dimensionName {
  heightDimension: string,
  colorDimension: string,
  timeline: string
}

export interface extremumMeshData {
  maximiumHeightData: DistrictMeshData,
  minimiumHeightData: DistrictMeshData,
  maximiumToneData: DistrictMeshData,
  minimiumToneData: DistrictMeshData
}

export class DistrictMeshData implements DistrictMeshData {
  public meshName: string = ''
  public zhCityName: string = ''
  public enCityName: string = ''
  public zhDistrictName: string = ''
  public enDistrictName: string = ''
  public mesh3d: Mesh = new Mesh()
  public rgbColor: { r: number, g: number, b: number } = { r: 0, g: 0, b: 0 }
  public tone: number = 0
  public height: number = 0
  construstor(init?: Partial<DistrictMeshData>) {
    Object.assign(this, init);
  }
}

export interface googleSheetRawData {
  version: string,
  reqId: string,
  status: string,
  sig: string,
  table: {
    cols: {
      id: string;
      label: string;
      type: string;
    }[];
    rows: {
      c: {
        v: string;
      }[];
    }[];
    parsedNumHeaders: number;
  }
}

export interface MapInfoInFirebase {
  HeightDimensionTitle: string;
  HeightDimensionUnit: string;
  MaxToneHex: string;
  MinToneHex: string;
  ToneDimensionTitle: string;
  ToneDimensionUnit: string;
  author: string;
  authorEmail: string;
  mapName: string;
  mapUrl: string;
  sourceData: string;
  sourceUrl: string;
}