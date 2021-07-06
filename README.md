# 全台鄉鎮市區天氣動態地圖

網址：https://umas-sunavan.github.io/districtgraphic-tw/

客製化的台灣行政區域圖，加上氣象資料所產生的台灣天氣地圖。

## 使用

滑鼠移到每個鄉鎮市區，即可顯示該鄉鎮市區的天氣狀況，包含降雨量以及最高溫度。

但不是每個鄉鎮市區都有氣象站，這代表有些地方會顯示無資料。資料的有無以氣象局的API為準。

一個行政區域可能有多個氣象站，專案中的降雨量為單一行政區內的降雨資料平均值。


## 開發說明

每個小時更新一次氣象資料，使用Three.js匯入Maya的自製3D物件。

由於每個鄉鎮市區都經過命名，所以可以透過地名的翻譯配對氣象局的API，進而將數據成現在畫面中。

本專案的地圖由政府開放資料平台提供https://data.gov.tw/dataset/7441
，除離島的相對位置外，台灣地圖資料都是參考實際行政區域界圖建模。

透過轉檔工具轉換成向量圖https://products.aspose.app/gis/viewer/shp-to-svg
，並匯出SVG到3D建模軟體建制。為了要減少3D物件的面數，所以行政區域的界線被極度的簡化。

透過Verge3D將檔案會出成GLTS檔，匯入到網頁中，透過Three.js開發3D互動。

字體方面，使用開源字形「粉圓體」https://justfont.com/huninn/
，提取所需要的行政區域文字名稱，透過Facetype.js轉成Json再匯入到網頁，以減少檔案大小。

## 未來規劃

- 支援RWD響應式網頁設計

- 開放用戶自由上傳資料以建立自己的地圖，並分享網址。同時透過Firebase儲存用戶上傳之資料

- 加上時間軸，藉此能夠讓用戶選擇（或自動輪播）數據變化情形

- 依照不同主題製作地圖，例如人口、疫情確診變化

- 減少3D面數。台灣本島地圖的底部有多餘的面數，預計可以提升效能

- 透過Shader製作著色器特效。開發時由於難以抓取不同行政區的位置資料（建模時它們的位置都設成0,0,0），所以難以透過ShaderMaterial製作特效（邊界發亮、外光暈、高度無線延伸的光暈等）。但目前已經能抓取不同行政區的位置資料，預計將能實現。

- 加上反鋸齒

- 埋點分析用戶行為

## 提供素材

- 預計開源台灣鄉鎮市區3D模型提供各方高手使用，3D模型所有鄉鎮（除東沙島外）都有鄉鎮市區的英文命名，建造出更有趣的互動效果，預計放在SketchFab，還請大家多指教！
- 預計開放專案中所整理的台灣鄉鎮市區中英文對照表（這關乎到該如何在前端對應不同行政區域的3D模型）。

## ThreeInAngular

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 12.0.3.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
