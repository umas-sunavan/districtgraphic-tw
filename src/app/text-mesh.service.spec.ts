import { TestBed } from '@angular/core/testing';

import { TextMeshService } from './text-mesh.service';

describe('TextMeshService', () => {
  let service: TextMeshService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TextMeshService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
