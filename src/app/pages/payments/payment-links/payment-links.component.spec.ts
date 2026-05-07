import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentLinksComponent } from './payment-links.component';

describe('PaymentLinksComponent', () => {
  let component: PaymentLinksComponent;
  let fixture: ComponentFixture<PaymentLinksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentLinksComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentLinksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
