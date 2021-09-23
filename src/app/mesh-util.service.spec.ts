import { TestBed } from '@angular/core/testing';

import { MeshUtilService } from './mesh-util.service';

describe('MeshUtilService', () => {
  let service: MeshUtilService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MeshUtilService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
