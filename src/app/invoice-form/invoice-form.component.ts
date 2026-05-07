import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; 
@Component({
  selector: 'app-invoice-form',
  imports: [
    FormsModule, CommonModule  // <-- Add FormsModule here
    // other modules...
  ],
  templateUrl: './invoice-form.component.html',
  styleUrls: ['./invoice-form.component.scss']
})
export class InvoiceFormComponent {
  @Input() isVisible: boolean = false;  // Controls visibility of the form
  @Input() invoiceData: any = {};  // Holds data for the invoice form
  @Output() formClosed = new EventEmitter<void>();  // Emit an event when the form is closed

  // Close the form
  closeForm() {
    this.isVisible = false;
    this.formClosed.emit();  // Emit event to parent component to notify that form is closed
  }

  // Open the form with data
  openForm(invoice: any) {
    this.isVisible = true;
    this.invoiceData = { ...invoice };  // Set invoice data for the form
  }

  // Handle form submission
  onSubmit() {
    console.log('Invoice data:', this.invoiceData);
    // Add save logic here, like calling a service to save data
  }
}