import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { InvoiceFormComponent } from '../../../invoice-form/invoice-form.component';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, PageHeaderComponent, InvoiceFormComponent],
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.scss'],
})
export class InvoicesComponent implements OnInit {
  tabs = ['All', 'Pending', 'Paid', 'Cancelled'];
  selectedTab = 'All';

  searchText = '';
  isLoading = false;

  invoices: any[] = [];
  filteredInvoices: any[] = [];

  totalAmount: number = 0;
  paidAmount: number = 0;
  pendingAmount: number = 0;

  apiUrl = 'https://billsezy.com/Api/get-invoice.php';
  updateStatusApiUrl = 'https://billsezy.com/Api/update-invoice-status.php';

  currentPage = 1;
  itemsPerPage = 10;
  selectedInvoice: any = null;

  constructor(
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.fetchInvoices();
  }

  fetchInvoices() {
    this.isLoading = true;
    
    let url = this.apiUrl;
    let params = [];
    
    if (this.selectedTab !== 'All') {
      params.push(`status=${this.selectedTab}`);
    }
    
    if (this.searchText) {
      params.push(`search=${encodeURIComponent(this.searchText)}`);
    }
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    
    this.http.get<any>(url).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        if (response.status === 'success') {
          this.invoices = response.data;
          this.filteredInvoices = [...this.invoices];
          
          if (response.summary) {
            this.totalAmount = response.summary.total_amount;
            this.paidAmount = response.summary.paid_amount;
            this.pendingAmount = response.summary.pending_amount;
          } else {
            this.calculateSummary();
          }
          
          console.log('Invoices loaded:', this.invoices);
        } else {
          console.error('API Error:', response.message);
          this.invoices = [];
          this.filteredInvoices = [];
          this.calculateSummary();
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('HTTP Error:', err);
        this.invoices = [];
        this.filteredInvoices = [];
        this.calculateSummary();
      }
    });
  }

  calculateSummary() {
    this.totalAmount = 0;
    this.paidAmount = 0;
    this.pendingAmount = 0;
    
    this.filteredInvoices.forEach(invoice => {
      const grandTotal = parseFloat(invoice.Grand_Total) || 0;
      const paid = parseFloat(invoice.Paid_Amount) || 0;
      const pending = parseFloat(invoice.Remaining_Amount) || 0;
      
      this.totalAmount += grandTotal;
      this.paidAmount += paid;
      this.pendingAmount += pending;
    });
    
    this.totalAmount = Math.round(this.totalAmount * 100) / 100;
    this.paidAmount = Math.round(this.paidAmount * 100) / 100;
    this.pendingAmount = Math.round(this.pendingAmount * 100) / 100;
  }

  filterData(tab: string) {
    this.selectedTab = tab;
    this.currentPage = 1;
    this.fetchInvoices();
  }

  searchSales() {
    this.currentPage = 1;
    this.fetchInvoices();
  }

  get paginatedInvoices() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredInvoices.slice(startIndex, endIndex);
  }

  nextPage() {
    if (this.currentPage < this.totalPages()) {
      this.currentPage++;
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  totalPages() {
    return Math.ceil(this.filteredInvoices.length / this.itemsPerPage);
  }

  getTotalAmount(): number {
    return this.totalAmount;
  }

  getPaidAmount(): number {
    return this.paidAmount;
  }

  getPendingAmount(): number {
    return this.pendingAmount;
  }

  // ✅ View Invoice - Pehle page redirect, ID query param mein bhejega
  viewInvoice(id: number) {
    console.log('View clicked for ID:', id);
    // Pehle page redirect karo with ID as query param
    this.router.navigate(['sales/view-invoice'], { queryParams: { id: id } });
  }

  updateInvoiceStatus(id: number, billNo: string, currentStatus: string) {
    if (currentStatus === 'Cancelled') {
      alert(`⚠️ Invoice ${billNo} is already cancelled.`);
      return;
    }
    
    if (confirm(`Are you sure you want to cancel Invoice ${billNo}?`)) {
      this.isLoading = true;
      
      const payload = {
        id: id,
        status: 'Cancelled'
      };
      
      this.http.post(this.updateStatusApiUrl, payload).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          
          if (response.status === 'success') {
            alert(`✅ ${response.message}`);
            this.fetchInvoices();
          } else {
            alert('❌ Error: ' + (response.message || 'Failed to cancel invoice'));
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Update Status Error:', err);
          alert('❌ Error connecting to server. Please try again.');
        }
      });
    }
  }

  editInvoice(id: number) {
    this.router.navigate(['/sales/create-invoice', id]);
  }

  openInvoiceForm(invoice: any) {
    this.selectedInvoice = invoice;
  }

  closeInvoiceForm() {
    this.selectedInvoice = null;
    this.fetchInvoices();
  }

  goToCreateInvoice() {
    this.router.navigate(['/sales/create-invoice']);
  }
  
  getStatusClass(status: string): string {
    switch(status.toLowerCase()) {
      case 'paid': return 'paid';
      case 'partial': return 'partial';
      case 'pending': return 'pending';
      case 'cancelled': return 'cancelled';
      default: return 'pending';
    }
  }
  
  formatAmount(amount: number): string {
    if (amount === undefined || amount === null) return '₹0';
    return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  
  isCancelDisabled(status: string): boolean {
    return status === 'Cancelled';
  }
}