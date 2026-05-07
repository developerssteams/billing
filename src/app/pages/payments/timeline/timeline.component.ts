import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';

@Component({
  selector: 'app-timeline',
  imports: [PageHeaderComponent,CommonModule, FormsModule],
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.scss',
})
export class TimelineComponent {

  constructor(private router: Router) {}

  // Sample data
  invoices: any[] = [
    {
      amount: 5000,
      status: 'Paid',
      mode: 'UPI',
      billNo: 'INV-001',
      customer: 'ABC Suppliers',
      date: '2024-01-15'
    },
    {
      amount: 12000,
      status: 'Pending',
      mode: 'Cash',
      billNo: 'INV-002',
      customer: 'XYZ Traders',
      date: '2024-01-20'
    },
    {
      amount: 8000,
      status: 'Paid',
      mode: 'Card',
      billNo: 'INV-003',
      customer: 'PQR Enterprises',
      date: '2024-02-05'
    },
    {
      amount: 15000,
      status: 'Pending',
      mode: 'Net Banking',
      billNo: 'INV-004',
      customer: 'LMN Industries',
      date: '2024-02-10'
    },
    {
      amount: 3000,
      status: 'Cancelled',
      mode: 'UPI',
      billNo: 'INV-005',
      customer: 'DEF Agencies',
      date: '2024-02-15'
    }
  ];

  // Tabs
  tabs: string[] = ['All', 'Paid', 'Pending', 'Cancelled'];
  selectedTab: string = 'All';
  
  // Search and Filter
  searchText: string = '';
  selectedYear: string = 'all';
  selectedAction: string = '';
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 5;
  
  // Filtered Data
  filteredData: any[] = [];
  paginatedData: any[] = [];

  ngOnInit() {
    this.filteredData = [...this.invoices];
    this.updatePaginatedData();
  }

  // Filter by Tab
  filterData(tab: string) {
    this.selectedTab = tab;
    this.applyFilters();
  }

  // Search Payments
  searchPayments() {
    this.applyFilters();
  }


  // Apply all filters
  applyFilters() {
    let data = [...this.invoices];

    // Tab filter
    if (this.selectedTab !== 'All') {
      data = data.filter(item => item.status === this.selectedTab);
    }

    // Search filter
    if (this.searchText.trim()) {
      const search = this.searchText.toLowerCase();
      data = data.filter(item =>
        item.customer.toLowerCase().includes(search) ||
        item.billNo.toLowerCase().includes(search) ||
        item.mode.toLowerCase().includes(search)
      );
    }

    // Year filter
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    if (this.selectedYear === 'this-year') {
      data = data.filter(item => {
        const itemYear = new Date(item.date).getFullYear();
        return itemYear === currentYear;
      });
    } else if (this.selectedYear === 'last-year') {
      data = data.filter(item => {
        const itemYear = new Date(item.date).getFullYear();
        return itemYear === currentYear - 1;
      });
    } else if (this.selectedYear === 'this-month') {
      data = data.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.getMonth() === currentMonth && 
               itemDate.getFullYear() === currentYear;
      });
    }

    this.filteredData = data;
    this.currentPage = 1;
    this.updatePaginatedData();
  }

  // Update Paginated Data
  updatePaginatedData() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedData = this.filteredData.slice(start, end);
  }

  // Pagination Methods
  nextPage() {
    if (this.currentPage < this.totalPages()) {
      this.currentPage++;
      this.updatePaginatedData();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedData();
    }
  }

  totalPages(): number {
    return Math.ceil(this.filteredData.length / this.itemsPerPage);
  }

  // Summary Calculations
  getTotalAmount(): number {
    return this.filteredData.reduce((sum, item) => sum + item.amount, 0);
  }

  getPaidAmount(): number {
    return this.filteredData
      .filter(item => item.status === 'Paid')
      .reduce((sum, item) => sum + item.amount, 0);
  }

  getPendingAmount(): number {
    return this.filteredData
      .filter(item => item.status === 'Pending')
      .reduce((sum, item) => sum + item.amount, 0);
  }



  handleAction() {
    if (this.selectedAction === 'export') {
      console.log('Export data');
      alert('Exporting data...');
    } else if (this.selectedAction === 'delete') {
      console.log('Delete data');
      alert('Delete functionality');
    } else if (this.selectedAction === 'print') {
      console.log('Print data');
      window.print();
    }
    this.selectedAction = '';
  }
}