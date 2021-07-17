import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphInfoComponent } from './graph-info.component';

describe('GraphInfoComponent', () => {
  let component: GraphInfoComponent;
  let fixture: ComponentFixture<GraphInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GraphInfoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GraphInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
