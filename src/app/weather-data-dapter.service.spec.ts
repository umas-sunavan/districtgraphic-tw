import { TestBed } from '@angular/core/testing';

import { WeatherDataDapterService } from './weather-data-dapter.service';

describe('WeatherDataDapterService', () => {
  let service: WeatherDataDapterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WeatherDataDapterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
