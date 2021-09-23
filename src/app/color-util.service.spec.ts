import { TestBed } from '@angular/core/testing';

import { ColorUtilService } from './color-util.service';

describe('ColorUtilService', () => {
  let service: ColorUtilService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ColorUtilService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
