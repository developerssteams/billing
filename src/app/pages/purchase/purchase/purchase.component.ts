import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { InvoiceFormComponent } from '../../../invoice-form/invoice-form.component';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-purchase',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, PageHeaderComponent, InvoiceFormComponent],
  templateUrl: './purchase.component.html',
  styleUrls: ['./purchase.component.scss'],
})
export class PurchaseComponent implements OnInit {
  tabs = ['All', 'Paid', 'Unpaid', 'Partially Paid', 'Cancelled'];
  selectedTab = 'All';

  searchText = '';
  isLoading = false;

  purchases: any[] = [];
  filteredPurchases: any[] = [];

  totalAmount: number = 0;
  paidAmount: number = 0;
  pendingAmount: number = 0;

  apiUrl = 'https://billsezy.com/Api/get-purchase.php';
  updateStatusApiUrl = 'https://billsezy.com/Api/update-purchase-status.php';

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
    this.fetchPurchases();
  }

  fetchPurchases() {
    this.isLoading = true;

    let url = `${this.apiUrl}?user_id=${this.userId}`;

    if (this.selectedTab !== 'All') {
      url += `&status=${this.selectedTab}`;
    }

    if (this.searchText) {
      url += `&search=${encodeURIComponent(this.searchText)}`;
    }

    console.log('Fetching purchases for user:', this.userId);
    console.log('URL:', url);

    this.http.get<any>(url).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('API Response:', response);

        if (response.status === true || response.status === 'success' || response.success === true) {
          this.purchases = response.data || [];
          this.filteredPurchases = [...this.purchases];
          this.calculateSummary();
          console.log('Purchases loaded:', this.purchases.length);
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

  // 🔥 SUMMARY - Cancelled purchases are EXCLUDED
  calculateSummary() {
    this.totalAmount = 0;
    this.paidAmount = 0;
    this.pendingAmount = 0;

    this.filteredPurchases.forEach(purchase => {
      // ✅ CRITICAL: Skip cancelled purchases from all totals
      if (purchase.Status === 'Cancelled') {
        console.log('Skipping cancelled purchase:', purchase.Bill_no);
        return;
      }

      const amount = parseFloat(purchase.Purchase_Price) || 0;
      const remaining = parseFloat(purchase.Remaining_Amount) || 0;
      const paid = parseFloat(purchase.Payable_Amount) || 0;

      this.totalAmount += amount;

      if (purchase.Status === 'Paid') {
        this.paidAmount += amount;
      } else if (purchase.Status === 'Partially Paid') {
        this.paidAmount += paid;
        this.pendingAmount += remaining;
      } else if (purchase.Status === 'Unpaid') {
        this.pendingAmount += amount;
      }
    });

    this.totalAmount = Math.round(this.totalAmount * 100) / 100;
    this.paidAmount = Math.round(this.paidAmount * 100) / 100;
    this.pendingAmount = Math.round(this.pendingAmount * 100) / 100;

    console.log('Summary - Total:', this.totalAmount, 'Paid:', this.paidAmount, 'Pending:', this.pendingAmount);
  }

  filterData(tab: string) {
    this.selectedTab = tab;
    this.currentPage = 1;
    this.fetchPurchases();
  }

  searchSales() {
    this.currentPage = 1;
    this.fetchPurchases();
  }

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

  getTotalAmount(): number {
    return this.totalAmount;
  }

  getPaidAmount(): number {
    return this.paidAmount;
  }

  getPendingAmount(): number {
    return this.pendingAmount;
  }

  // 🔥 View Purchase (if needed)
  viewPurchase(id: number) {
    this.router.navigate(['purchase/view-purchase'], { queryParams: { id: id } });
  }

  editPurchase(id: number) {
    this.router.navigate(['/purchase/create-purchase'], { queryParams: { id: id } });
  }

  updatePurchaseStatus(id: number, billNo: string, currentStatus: string) {
    if (currentStatus === 'Cancelled') {
      alert(`⚠️ Purchase ${billNo} is already cancelled.`);
      return;
    }

    if (currentStatus === 'Paid') {
      alert(`⚠️ Cannot cancel a paid purchase.`);
      return;
    }

    if (confirm(`Are you sure you want to cancel Purchase ${billNo}?`)) {
      this.isLoading = true;

      const payload = {
        id: id,
        user_id: this.userId,
        status: 'Cancelled'
      };

      this.http.post(this.updateStatusApiUrl, payload).subscribe({
        next: (response: any) => {
          this.isLoading = false;

          if (response.status === true || response.status === 'success') {
            alert(`✅ Purchase cancelled successfully!`);
            this.fetchPurchases();
          } else {
            alert('❌ ' + (response.message || 'Failed to cancel purchase'));
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Update Status Error:', err);
          alert('❌ Server error');
        }
      });
    }
  }

  openInvoiceForm(invoice: any) {
    this.selectedInvoice = invoice;
  }

  closeInvoiceForm() {
    this.selectedInvoice = null;
    this.fetchPurchases();
  }

  goToCreatePurchasePage() {
    this.router.navigate(['/purchase/create-purchase']);
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
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
}