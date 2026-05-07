import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { InvoiceFormComponent } from '../../../invoice-form/invoice-form.component';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-purchase',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, PageHeaderComponent, InvoiceFormComponent],
  templateUrl: './purchase.component.html',
  styleUrls: ['./purchase.component.scss'],
})
export class PurchaseComponent implements OnInit {
  tabs = ['All', 'Pending', 'Paid', 'Cancelled'];
  selectedTab = 'All';

  searchText = '';
  isLoading = false;

  // Data from API
  purchases: any[] = [];
  filteredPurchases: any[] = [];

  // Summary amounts
  totalAmount: number = 0;
  paidAmount: number = 0;
  pendingAmount: number = 0;

  // API URLs
  apiUrl = 'https://billsezy.com/Api/get-purchase.php';
  updateStatusApiUrl = 'https://billsezy.com/Api/update-purchase-status.php';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;

  // Invoice form
  selectedInvoice: any = null;

  constructor(
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.fetchPurchases();
  }

  // ==================== FETCH DATA FROM API ====================
  fetchPurchases() {
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
          this.purchases = response.data;
          this.filteredPurchases = [...this.purchases];
          
          if (response.summary) {
            this.totalAmount = response.summary.total_amount;
            this.paidAmount = response.summary.paid_amount;
            this.pendingAmount = response.summary.pending_amount;
          } else {
            this.calculateSummary();
          }
          
          console.log('Purchases loaded:', this.purchases);
        } else {
          console.error('API Error:', response.message);
          this.purchases = [];
          this.filteredPurchases = [];
          this.calculateSummary();
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('HTTP Error:', err);
        this.purchases = [];
        this.filteredPurchases = [];
        this.calculateSummary();
      }
    });
  }

  // ==================== CALCULATE SUMMARY ====================
  calculateSummary() {
    this.totalAmount = 0;
    this.paidAmount = 0;
    this.pendingAmount = 0;
    
    this.filteredPurchases.forEach(purchase => {
      const amount = parseFloat(purchase.Purchase_Price) || 0;
      const remaining = parseFloat(purchase.Remaining_Amount) || 0;
      const payable = parseFloat(purchase.Payable_Amount) || 0;
      
      this.totalAmount += amount;
      
      if (purchase.Status === 'Paid') {
        this.paidAmount += amount;
      } else if (purchase.Status === 'Partial') {
        this.paidAmount += payable;
        this.pendingAmount += remaining;
      } else if (purchase.Status === 'Pending') {
        this.pendingAmount += amount;
      } else if (purchase.Status === 'Cancelled') {
        // Cancelled - add to pending or ignore? Adding to pending for now
        this.pendingAmount += amount;
      }
    });
    
    this.totalAmount = Math.round(this.totalAmount * 100) / 100;
    this.paidAmount = Math.round(this.paidAmount * 100) / 100;
    this.pendingAmount = Math.round(this.pendingAmount * 100) / 100;
  }

  // ==================== FILTER DATA ====================
  filterData(tab: string) {
    this.selectedTab = tab;
    this.currentPage = 1;
    this.fetchPurchases();
  }

  // ==================== SEARCH ====================
  searchSales() {
    this.currentPage = 1;
    this.fetchPurchases();
  }

  // ==================== PAGINATION ====================
  get paginatedPurchases() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredPurchases.slice(startIndex, endIndex);
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
    return Math.ceil(this.filteredPurchases.length / this.itemsPerPage);
  }

  // ==================== SUMMARY GETTERS ====================
  getTotalAmount(): number {
    return this.totalAmount;
  }

  getPaidAmount(): number {
    return this.paidAmount;
  }

  getPendingAmount(): number {
    return this.pendingAmount;
  }

  // ==================== UPDATE PURCHASE STATUS (CANCEL) ====================
  updatePurchaseStatus(id: number, billNo: string, currentStatus: string) {
    // If already cancelled, don't allow
    if (currentStatus === 'Cancelled') {
      alert(`⚠️ Purchase ${billNo} is already cancelled.`);
      return;
    }
    
    // Confirm before cancelling
    if (confirm(`Are you sure you want to cancel Purchase ${billNo}?`)) {
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
            this.fetchPurchases(); // Refresh the list
          } else {
            alert('❌ Error: ' + (response.message || 'Failed to cancel purchase'));
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

  // ==================== INVOICE FORM ====================
  openInvoiceForm(invoice: any) {
    this.selectedInvoice = invoice;
  }

  closeInvoiceForm() {
    this.selectedInvoice = null;
    this.fetchPurchases();
  }

  // ==================== NAVIGATION ====================
  goToCreatePurchasePage() {
    this.router.navigate(['/purchase/create-purchase']);
  }
  
  // ==================== GET STATUS CLASS ====================
  getStatusClass(status: string): string {
    switch(status.toLowerCase()) {
      case 'paid': return 'paid';
      case 'partial': return 'partial';
      case 'pending': return 'pending';
      case 'cancelled': return 'cancelled';
      default: return 'pending';
    }
  }
  
  // ==================== FORMAT CURRENCY ====================
  formatAmount(amount: number): string {
    if (amount === undefined || amount === null) return '₹0';
    return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  
  // ==================== CHECK IF CANCEL BUTTON SHOULD BE DISABLED ====================
  isCancelDisabled(status: string): boolean {
    return status === 'Cancelled';
  }
}