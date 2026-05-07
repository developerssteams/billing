import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EwayBillsComponent } from './eway-bills.component';

describe('EwayBillsComponent', () => {
  let component: EwayBillsComponent;
  let fixture: ComponentFixture<EwayBillsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EwayBillsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EwayBillsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
