import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-view-invoice',
  imports: [],
  templateUrl: './view-invoice.component.html',
  styleUrl: './view-invoice.component.scss',
})
export class ViewInvoiceComponent {

  billItems: any[] = [];
  constructor(
    private router: Router,
  ) { }
  goBack() {
    this.router.navigate(['/sales/add-invoice']);
  }
// Add this method in your component class
printInvoice() {
    window.print();
}
  cancel() {
    if (this.billItems.length > 0 ) {
      if (confirm('Are you sure you want to cancel? All unsaved data will be lost.')) {
        this.router.navigate(['/sales/add-invoice']);
      }
    } else {
      this.router.navigate(['/sales/add-invoice']);
    }
  }
    save() {
    if (this.billItems.length === 0) {
      alert('Please add at least one product!');
      return;
    }
}
}
