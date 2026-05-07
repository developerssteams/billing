import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateDebitNoteComponent } from './create-debit-note.component';

describe('CreateDebitNoteComponent', () => {
  let component: CreateDebitNoteComponent;
  let fixture: ComponentFixture<CreateDebitNoteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateDebitNoteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateDebitNoteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
