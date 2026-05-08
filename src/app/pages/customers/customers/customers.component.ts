import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CustomerFormComponent } from '../../../components/customer-form/customer-form.component';

@Component({
  selector: 'app-customers',
  imports: [CommonModule, FormsModule, PageHeaderComponent, CustomerFormComponent],
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss']
})
export class CustomersComponent {
  constructor(private http: HttpClient) { }

  searchText = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;

  // Customer List
  customerData: any[] = [];
  filteredData: any[] = [];
  paginatedData: any[] = [];

  // Form Modal Control
  showCustomerForm = false;
  isEditMode = false;
  selectedCustomer: any = null;

  // User ID
  userId: number = 1;

  ngOnInit() {
    this.filteredData = this.customerData;
    this.updatePaginatedData();
    this.getCustomers();
  }

  // Search
  searchCustomer() {
    this.filteredData = this.customerData.filter((item: any) =>
      item.name?.toLowerCase().includes(this.searchText.toLowerCase()) ||
      item.company_name?.toLowerCase().includes(this.searchText.toLowerCase()) ||
      item.phone?.includes(this.searchText)
    );
    this.currentPage = 1;
    this.updatePaginatedData();
  }

  // Pagination
  updatePaginatedData() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedData = this.filteredData.slice(startIndex, endIndex);
  }

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

  totalPages() {
    return Math.ceil(this.filteredData.length / this.itemsPerPage);
  }

  // Open Form
  openForm(customer?: any) {
    if (customer) {
      this.isEditMode = true;
      this.selectedCustomer = customer;
    } else {
      this.isEditMode = false;
      this.selectedCustomer = null;
    }
    this.showCustomerForm = true;
  }

  // Close Form
  closeForm() {
    this.showCustomerForm = false;
    this.isEditMode = false;
    this.selectedCustomer = null;
  }

  // When Customer Saved
  onCustomerSaved(customer: any) {
    this.getCustomers();
    this.closeForm();
  }

  // Delete Customer
  deleteCustomer(id: number, name: string) {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      fetch('https://billsezy.com/Api/delete_customer.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, user_id: this.userId })
      })
        .then(res => res.json())
        .then(res => {
          if (res.status === true) {
            this.getCustomers();
            alert('Customer deleted successfully ✅');
          } else {
            alert(res.message || 'Failed to delete customer');
          }
        })
        .catch(err => {
          alert('Server Error ❌');
        });
    }
  }

  // Get Customers
  getCustomers() {
    fetch(`https://billsezy.com/Api/get_customers.php?user_id=${this.userId}`)
      .then(res => res.json())
      .then(res => {
        if (res.status === true) {
          this.customerData = res.data || [];
          this.filteredData = [...this.customerData];
          this.currentPage = 1;
          this.updatePaginatedData();
        }
      })
      .catch(err => console.error(err));
  }

  // Summary - Positive = You Collect, Negative = You Pay
  getTotalPay(): number {
    return this.customerData
      .filter(c => c.opening_balance < 0)
      .reduce((sum, c) => sum + Math.abs(Number(c.opening_balance || 0)), 0);
  }

  getTotalCollect(): number {
    return this.customerData
      .filter(c => c.opening_balance > 0)
      .reduce((sum, c) => sum + Number(c.opening_balance || 0), 0);
  }
}