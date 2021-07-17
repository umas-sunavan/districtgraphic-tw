import { Component, Input, OnInit, Output, ViewChild, EventEmitter } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { FormControl, FormGroup } from '@angular/forms';
import { DistrictMeshData } from '../interfaces';
import { WeatherService } from '../weather.service';

@Component({
  selector: 'app-graph-info',
  templateUrl: './graph-info.component.html',
  styleUrls: ['./graph-info.component.scss']
})
export class GraphInfoComponent implements OnInit {
  showEditMapPopup: boolean = false
  showLinkPopup: boolean = false
  shareLink: string = ''
  showCreateMapPopup:boolean = false
  constructor(
    public weatherService: WeatherService,
  ) { }
  @Input('districtColor') htmlTextColor: string = ''
  @Input('mouseHoverDetalessMesh') mouseHoverDetalessMesh: boolean = false
  @Input('mouseHoveAnyMesh') mouseHoveAnyMesh: boolean = false
  @Input('meshDataOnHtml') meshDataOnHtml?: DistrictMeshData;
  @Output() updateMapBySheetId = new EventEmitter<string>()
  @Output() blurGraph = new EventEmitter<boolean>()


  ngOnInit(): void {
  }

  openCreateProcess = (btn:any) => {
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

  submitEditingMap = (mapAttribute: { authorName: string, authorEmail: string, mapTitle: string }, mapSource: { urlLink: string, goNextPopup: string }) => {
    this.showEditMapPopup = !this.showEditMapPopup
    this.showLinkPopup = !this.showLinkPopup
    const pushedMapRef = this.weatherService.pushMapToFirebase(mapAttribute,mapSource)


    console.log(pushedMapRef.key);
    if (pushedMapRef.key) {
      const mapId:string = pushedMapRef.key
      this.weatherService.setMapRefAsUrlToFirebase(pushedMapRef,mapId)
      this.shareLink = window.location.origin + this.weatherService.addBaseUrl('') + 'maps/' + mapId
      this.updateMapBySheetId.emit(mapId)    
    }
  }

  copyShareLink = (btnElement: HTMLButtonElement, shareLink: string) => {
    btnElement.children[1].innerHTML = "複製成功！"
    navigator.clipboard.writeText(shareLink)
  }

}
