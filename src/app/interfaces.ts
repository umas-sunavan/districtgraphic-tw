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

export interface districtData {
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

export interface MeshData {
  meshName: string,
  zhCityName: string,
  enCityName: string,
  zhDistrictName: string,
  enDistrictName: string,
  mesh3d: Mesh,
  rgbColor: { r: number, g: number, b: number },
}

export interface dimensionName {
  heightDimension: string,
  colorDimension: string,
  timeline: string
}

export interface extremumMeshData {
  maximiumHeightData: MeshData,
  minimiumHeightData: MeshData,
  maximiumToneData: MeshData,
  minimiumToneData: MeshData
}