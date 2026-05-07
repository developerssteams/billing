import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProformaComponent } from './proforma.component';

describe('ProformaComponent', () => {
  let component: ProformaComponent;
  let fixture: ComponentFixture<ProformaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProformaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProformaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
