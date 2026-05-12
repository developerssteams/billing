import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule,],
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.scss'],
})
export class InvoicesComponent implements OnInit {
  tabs = ['All', 'Paid', 'Unpaid', 'Partially Paid', 'Cancelled'];
  selectedTab = 'All';

  searchText = '';
  isLoading = false;

  invoices: any[] = [];
  filteredInvoices: any[] = [];

  totalAmount: number = 0;
  paidAmount: number = 0;
  pendingAmount: number = 0;

  apiUrl = 'https://billsezy.com/Api/get_invoices.php';
  updateStatusApiUrl = 'https://billsezy.com/Api/update_invoice_status.php';

  currentPage = 1;
  itemsPerPage = 10;
  selectedInvoice: any = null;

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService
  ) { }

  get userId(): number {
    const userId = this.authService.getUserId();
    return userId || 1;
  }

  ngOnInit(): void {
    this.fetchInvoices();
  }

  fetchInvoices() {
    this.isLoading = true;
    
    // ✅ Add user_id to API call
    let url = `${this.apiUrl}?user_id=${this.userId}`;
    
    if (this.selectedTab !== 'All') {
      url += `&status=${this.selectedTab}`;
    }
    
    if (this.searchText) {
      url += `&search=${encodeURIComponent(this.searchText)}`;
    }
    
    this.http.get<any>(url).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        if (response.status === true) {
          this.invoices = response.data || [];
          this.filteredInvoices = [...this.invoices];
          this.calculateSummary();
          console.log('Invoices loaded:', this.invoices.length);
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

  viewInvoice(id: number) {
    this.router.navigate(['sales/view-invoice'], { queryParams: { id: id } });
  }

  updateInvoiceStatus(id: number, billNo: string, currentStatus: string) {
    if (currentStatus === 'Cancelled') {
      alert(`⚠️ Invoice ${billNo} is already cancelled.`);
      return;
    }
    
    if (currentStatus === 'Paid') {
      alert(`⚠️ Cannot cancel a paid invoice.`);
      return;
    }
    
    if (confirm(`Are you sure you want to cancel Invoice ${billNo}?`)) {
      this.isLoading = true;
      
      const payload = {
        id: id,
        user_id: this.userId,
        status: 'Cancelled'
      };
      
      this.http.post(this.updateStatusApiUrl, payload).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          
          if (response.status === true) {
            alert(`✅ Invoice cancelled successfully!`);
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
    this.router.navigate(['/sales/create-invoice'], { queryParams: { id: id } });
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
    switch(status?.toLowerCase()) {
      case 'paid': return 'status-paid';
      case 'partially paid': return 'status-partial';
      case 'unpaid': return 'status-unpaid';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-unpaid';
    }
  }
  
  formatAmount(amount: number): string {
    if (amount === undefined || amount === null) return '₹0';
    return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  
  isCancelDisabled(status: string): boolean {
    return status === 'Cancelled' || status === 'Paid';
  }

  goBack() {
    this.router.navigate(['/']);
  }
}