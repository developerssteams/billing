import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { InvoiceFormComponent } from '../../../invoice-form/invoice-form.component';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-credit-notes',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, PageHeaderComponent, InvoiceFormComponent],
  templateUrl: './credit-notes.component.html',
  styleUrls: ['./credit-notes.component.scss'],
})
export class CreditNotesComponent implements OnInit {
  tabs = ['All', 'Pending', 'Paid'];
  selectedTab = 'All';

  searchText = '';
  isLoading = false;

  // Data from API
  creditNotes: any[] = [];
  filteredCreditNotes: any[] = [];

  // Summary amounts
  totalAmount: number = 0;
  receivedAmount: number = 0;
  pendingAmount: number = 0;

  // API URLs
  apiUrl = 'https://billsezy.com/Api/get-credit-notes.php';
  deleteApiUrl = 'https://billsezy.com/Api/delete-credit-note.php';

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
    this.fetchCreditNotes();
  }

  // ==================== FETCH DATA FROM API ====================
  fetchCreditNotes() {
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
          this.creditNotes = response.data;
          this.filteredCreditNotes = [...this.creditNotes];
          
          if (response.summary) {
            this.totalAmount = response.summary.total_amount;
            this.receivedAmount = response.summary.paid_amount;
            this.pendingAmount = response.summary.pending_amount;
          } else {
            this.calculateSummary();
          }
          
          console.log('Credit Notes loaded:', this.creditNotes);
        } else {
          console.error('API Error:', response.message);
          this.creditNotes = [];
          this.filteredCreditNotes = [];
          this.calculateSummary();
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('HTTP Error:', err);
        this.creditNotes = [];
        this.filteredCreditNotes = [];
        this.calculateSummary();
      }
    });
  }

  // ==================== CALCULATE SUMMARY ====================
  calculateSummary() {
    this.totalAmount = 0;
    this.receivedAmount = 0;
    this.pendingAmount = 0;
    
    this.filteredCreditNotes.forEach(note => {
      const grandTotal = parseFloat(note.Grand_Total) || 0;
      const remainingAmount = parseFloat(note.Remaining_Amount) || 0;
      const received = grandTotal - remainingAmount;
      
      this.totalAmount += grandTotal;
      this.receivedAmount += received;
      this.pendingAmount += remainingAmount;
    });
    
    this.totalAmount = Math.round(this.totalAmount * 100) / 100;
    this.receivedAmount = Math.round(this.receivedAmount * 100) / 100;
    this.pendingAmount = Math.round(this.pendingAmount * 100) / 100;
    
    console.log('Summary - Total:', this.totalAmount, 'Received:', this.receivedAmount, 'Pending:', this.pendingAmount);
  }

  // ==================== FILTER DATA ====================
  filterData(tab: string) {
    this.selectedTab = tab;
    this.currentPage = 1;
    this.fetchCreditNotes();
  }

  // ==================== SEARCH ====================
  searchSales() {
    this.currentPage = 1;
    this.fetchCreditNotes();
  }

  // ==================== PAGINATION ====================
  get paginatedCreditNotes() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredCreditNotes.slice(startIndex, endIndex);
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
    return Math.ceil(this.filteredCreditNotes.length / this.itemsPerPage);
  }

  // ==================== SUMMARY GETTERS ====================
  getTotalAmount(): number {
    return this.totalAmount;
  }

  getReceivedAmount(): number {
    return this.receivedAmount;
  }

  getPendingAmount(): number {
    return this.pendingAmount;
  }

  // ==================== DELETE CREDIT NOTE ====================
  deleteCreditNote(id: number, billNo: string) {
    // Confirm before delete
    if (confirm(`Are you sure you want to delete Credit Note ${billNo}?`)) {
      this.isLoading = true;
      
      // Call delete API
      this.http.delete(`${this.deleteApiUrl}?id=${id}`).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          
          if (response.status === 'success') {
            alert(`✅ ${response.message}`);
            // Refresh the list after successful deletion
            this.fetchCreditNotes();
          } else {
            alert('❌ Error: ' + (response.message || 'Failed to delete credit note'));
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Delete Error:', err);
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
    this.fetchCreditNotes();
  }

  // ==================== NAVIGATION ====================
  goToCreateCreditNote() {
    this.router.navigate(['/purchase/create-credit-note']);
  }
  
  // ==================== GET STATUS CLASS ====================
  getStatusClass(status: string): string {
    switch(status.toLowerCase()) {
      case 'paid': return 'paid';
      case 'partial': return 'partial';
      case 'pending': return 'pending';
      default: return 'pending';
    }
  }
  
  // ==================== FORMAT CURRENCY ====================
  formatAmount(amount: number): string {
    if (amount === undefined || amount === null) return '₹0';
    return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  
  // ==================== GET RECEIVED AMOUNT FOR A SINGLE NOTE ====================
  getReceivedAmountForNote(note: any): number {
    const grandTotal = parseFloat(note.Grand_Total) || 0;
    const remaining = parseFloat(note.Remaining_Amount) || 0;
    return grandTotal - remaining;
  }
}