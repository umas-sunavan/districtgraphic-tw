import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GraphicComponent } from './graphic/graphic.component';

const routes: Routes = [
  { path: '',   redirectTo: 'maps/weather', pathMatch: 'full' },
  { path: 'maps/:id', component: GraphicComponent },
  { path: '**', component: GraphicComponent },
];;

@NgModule({
  imports: [RouterModule.forRoot(
    routes,
    { enableTracing: true } // <-- debugging purposes only
  )],
  exports: [RouterModule]
})
export class AppRoutingModule { }
