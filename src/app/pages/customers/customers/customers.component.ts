import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CustomerFormComponent } from '../../../components/customer-form/customer-form.component'; // Adjust path as needed

@Component({
  selector: 'app-customers',
  imports: [CommonModule, FormsModule, PageHeaderComponent, CustomerFormComponent],
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss']
})
export class CustomersComponent {
  constructor(private http: HttpClient) { }

  searchText = '';

  // 🔹 Pagination
  currentPage = 1;
  itemsPerPage = 10;

  // 🔹 Customer List
  customerData: any[] = [];
  filteredData: any[] = [];
  paginatedData: any[] = [];

  // 🔹 Form Modal Control
  showCustomerForm = false;
  isEditMode = false;
  selectedCustomer: any = null;

  // 🔹 Lifecycle
  ngOnInit() {
    this.filteredData = this.customerData;
    this.updatePaginatedData();
    this.getCustomers();
  }

  // 🔹 Search
  searchCustomer() {
    this.filteredData = this.customerData.filter((item: any) =>
      item.name.toLowerCase().includes(this.searchText.toLowerCase())
    );
    this.currentPage = 1;
    this.updatePaginatedData();
  }

  // 🔹 Pagination
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

  // 🔹 Open Form (Add/Edit)
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

  // 🔹 Close Form
  closeForm() {
    this.showCustomerForm = false;
    this.isEditMode = false;
    this.selectedCustomer = null;
  }

  // 🔹 When Customer Saved (Add/Edit)
  onCustomerSaved(customer: any) {
    this.getCustomers(); // Refresh list
    this.closeForm();
  }

  // 🔥 DELETE CUSTOMER
  deleteCustomer(id: number, name: string) {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      fetch('https://billsezy.com/Api/delete_customer.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id })
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
          console.error('Error:', err);
          alert('Server Error ❌');
        });
    }
  }

  // 🔥 GET CUSTOMERS
  getCustomers() {
    fetch('https://billsezy.com/Api/get_customers.php')
      .then(res => res.json())
      .then(res => {
        if (res.status === true) {
          this.customerData = res.data;
          this.filteredData = [...this.customerData];
          this.currentPage = 1;
          this.updatePaginatedData();
        }
      })
      .catch(err => console.error(err));
  }

  // 🔥 VIEW LEDGER
  viewLedger(customer: any) {
    alert(`Viewing ledger for ${customer.name}`);
  }

  // 🔥 SUMMARY
  getTotalPay(): number {
    return this.customerData
      .filter(c => c.balance_type === 'credit')
      .reduce((sum, c) => sum + Number(c.opening_balance || 0), 0);
  }

  getTotalCollect(): number {
    return this.customerData
      .filter(c => c.balance_type === 'debit')
      .reduce((sum, c) => sum + Number(c.opening_balance || 0), 0);
  }
}