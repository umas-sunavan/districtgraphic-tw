import { Injectable } from '@angular/core';
import { Material, Mesh, Object3D } from 'three';
import { DistrictMeshData } from './interfaces';

@Injectable({
  providedIn: 'root'
})
export class MeshUtilService {

  constructor() { }

  findMeshFromIndex = (source: Object3D, array: DistrictMeshData[], index: number): Mesh => {
    let retrunMesh: Mesh = new Mesh()
    source.traverse(mesh => {
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

  findDataByMeshName = (meshesData: DistrictMeshData[], mesh: Mesh): DistrictMeshData | undefined => {
    return meshesData.find(meshData => `${meshData.enDistrictName}_${meshData.enCityName}` === mesh.name)
  }

  transparentMeshes = (object3d: Object3D, opacity: number = 0.6) => {
    object3d.traverse(mesh => this.transparentMesh(<Mesh>mesh, opacity))
  }

  transparentMesh = (mesh: Mesh, opacity: number = 0.6) => {
    if (mesh.isMesh) {
      const currentMaterial: Material = (<Material>mesh.material)
      if (opacity === 1) {
        currentMaterial.transparent = false
      } else {
        currentMaterial.transparent = true
        // @ts-ignore
        currentMaterial.color = { r: 1, g: 1, b: 1 };
        currentMaterial.opacity = opacity
      }
    }
  }

  paintMesh = (mesh: Mesh, color: { r:number, g:number, b:number }) => {
    // @ts-ignore
    mesh.material.color = color
  }

  resetMeshGeometry = (mesh: Mesh) => {
    mesh.scale.setY(1)
    mesh.position.setY(0.5)
  }
}
