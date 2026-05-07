import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { InvoiceFormComponent } from '../../../invoice-form/invoice-form.component';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-debit-notes',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, PageHeaderComponent, InvoiceFormComponent],
  templateUrl: './debit-notes.component.html',
  styleUrls: ['./debit-notes.component.scss'],
})
export class DebitNotesComponent implements OnInit {
  tabs = ['All', 'Pending', 'Paid'];
  selectedTab = 'All';

  searchText = '';
  isLoading = false;

  // Data from API
  debitNotes: any[] = [];
  filteredDebitNotes: any[] = [];

  // Summary amounts
  totalAmount: number = 0;
  paidAmount: number = 0;
  pendingAmount: number = 0;

  // API URLs
  apiUrl = 'https://billsezy.com/Api/get-debit-note.php';
  deleteApiUrl = 'https://billsezy.com/Api/delete-debit-note.php';

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
    this.fetchDebitNotes();
  }

  // ==================== FETCH DATA FROM API ====================
  fetchDebitNotes() {
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
          this.debitNotes = response.data;
          this.filteredDebitNotes = [...this.debitNotes];
          
          if (response.summary) {
            this.totalAmount = response.summary.total_amount;
            this.paidAmount = response.summary.paid_amount;
            this.pendingAmount = response.summary.pending_amount;
          } else {
            this.calculateSummary();
          }
          
          console.log('Debit Notes loaded:', this.debitNotes);
        } else {
          console.error('API Error:', response.message);
          this.debitNotes = [];
          this.filteredDebitNotes = [];
          this.calculateSummary();
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('HTTP Error:', err);
        this.debitNotes = [];
        this.filteredDebitNotes = [];
        this.calculateSummary();
      }
    });
  }

  // ==================== CALCULATE SUMMARY ====================
  calculateSummary() {
    this.totalAmount = 0;
    this.paidAmount = 0;
    this.pendingAmount = 0;
    
    this.filteredDebitNotes.forEach(note => {
      const amount = parseFloat(note.Selling_Price) || 0;
      const remaining = parseFloat(note.Remaining_Amount) || 0;
      const payable = parseFloat(note.Payable_Amount) || 0;
      
      this.totalAmount += amount;
      
      if (note.Status === 'Paid') {
        this.paidAmount += amount;
      } else if (note.Status === 'Partial') {
        this.paidAmount += payable;
        this.pendingAmount += remaining;
      } else if (note.Status === 'Pending') {
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
    this.fetchDebitNotes();
  }

  // ==================== SEARCH ====================
  searchSales() {
    this.currentPage = 1;
    this.fetchDebitNotes();
  }

  // ==================== PAGINATION ====================
  get paginatedDebitNotes() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredDebitNotes.slice(startIndex, endIndex);
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
    return Math.ceil(this.filteredDebitNotes.length / this.itemsPerPage);
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

  // ==================== DELETE DEBIT NOTE ====================
  deleteDebitNote(id: number, billNo: string) {
    // Confirm before delete
    if (confirm(`Are you sure you want to delete Debit Note ${billNo}?`)) {
      this.isLoading = true;
      
      // Call delete API
      this.http.delete(`${this.deleteApiUrl}?id=${id}`).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          
          if (response.status === 'success') {
            alert(`✅ ${response.message}`);
            // Refresh the list after successful deletion
            this.fetchDebitNotes();
          } else {
            alert('❌ Error: ' + (response.message || 'Failed to delete debit note'));
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
    this.fetchDebitNotes();
  }

  // ==================== NAVIGATION ====================
  goToCreateDebitNotePage() {
    this.router.navigate(['/purchase/create-debit-note']);
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
}