import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DebitNotesComponent } from './debit-notes.component';

describe('DebitNotesComponent', () => {
  let component: DebitNotesComponent;
  let fixture: ComponentFixture<DebitNotesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DebitNotesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DebitNotesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
