import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';

@Component({
  selector: 'app-customers',
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss']
})
export class CustomersComponent {
  constructor(private http: HttpClient) { }

  searchText = '';
  gstLoading: boolean = false;
  gstError: string = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;

  // Customer List
  customerData: any[] = [];
  filteredData: any[] = [];
  paginatedData: any[] = [];

  // Edit Mode
  isEditMode: boolean = false;
  editCustomerId: number | null = null;

  // Form Data
  newCustomer: any = {
    name: '',
    phone: '',
    email: '',
    company_name: '',
    gstin: '',
    address_line1: '',
    address_line2: '',
    pincode: '',
    state: '',
    city: '',
    opening_balance: 0
  };

  // User ID
  userId: number = 1;

  ngOnInit() {
    this.filteredData = this.customerData;
    this.updatePaginatedData();
    this.getCustomers();
  }

  // 🔹 GST Check
  checkGST(event: any) {
    let gstNumber = event.target.value.toUpperCase().trim();
    this.newCustomer.gstin = gstNumber;
    this.gstError = '';

    if (gstNumber.length === 15) {
      this.fetchGSTDetails(gstNumber);
    }
  }

  fetchGSTDetails(gstin: string) {
    this.gstLoading = true;
    this.gstError = '';

    this.http.get(`https://billsezy.com/Api/gst-fetch.php?gstin=${gstin}`)
      .subscribe(
        (res: any) => {
          this.gstLoading = false;
          if (res?.status && res?.data) {
            const data = res.data;
            this.newCustomer.company_name = data.tradeNam || data.lgnm || '';
            this.newCustomer.address_line1 = data.pradr?.addr?.bno || '';
            this.newCustomer.address_line2 = data.pradr?.addr?.st || '';
            this.newCustomer.city = data.pradr?.addr?.loc || '';
            this.newCustomer.pincode = data.pradr?.addr?.pncd || '';
            this.newCustomer.state = data.pradr?.addr?.stcd || '';
          } else {
            this.gstError = res?.message || "Invalid GST Number / No Data Found";
          }
        },
        (error: any) => {
          this.gstLoading = false;
          this.gstError = "GST fetch failed";
        }
      );
  }

  // 🔹 Phone Restriction
  onlyNumber(event: any) {
    const input = event.target;
    input.value = input.value.replace(/[^0-9]/g, '').slice(0, 10);
    this.newCustomer.phone = input.value;
  }

  // 🔹 SEARCH
  searchCustomer() {
    this.filteredData = this.customerData.filter((item: any) =>
      item.name?.toLowerCase().includes(this.searchText.toLowerCase()) ||
      item.company_name?.toLowerCase().includes(this.searchText.toLowerCase()) ||
      item.phone?.includes(this.searchText)
    );
    this.currentPage = 1;
    this.updatePaginatedData();
  }

  // 🔹 PAGINATION
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

  // 🔹 FORM
  showCustomerForm = false;

  openForm(customer?: any) {
    if (customer) {
      this.isEditMode = true;
      this.editCustomerId = customer.id;
      this.newCustomer = {
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        company_name: customer.company_name || '',
        gstin: customer.gstin || '',
        address_line1: customer.address_line1 || '',
        address_line2: customer.address_line2 || '',
        pincode: customer.pincode || '',
        state: customer.state || '',
        city: customer.city || '',
        opening_balance: Math.abs(customer.opening_balance) || 0
      };
    } else {
      this.isEditMode = false;
      this.editCustomerId = null;
      this.resetForm();
    }
    this.showCustomerForm = true;
  }

  closeForm() {
    this.showCustomerForm = false;
    this.isEditMode = false;
    this.editCustomerId = null;
    this.resetForm();
  }

  resetForm() {
    this.newCustomer = {
      name: '',
      phone: '',
      email: '',
      company_name: '',
      gstin: '',
      address_line1: '',
      address_line2: '',
      pincode: '',
      state: '',
      city: '',
      opening_balance: 0
    };
    this.gstError = '';
  }

  // 🔥 ADD/UPDATE CUSTOMER
  isLoading = false;

  addCustomer() {
    if (!this.newCustomer.name) {
      alert('Name required');
      return;
    }

    if (this.isLoading) return;
    this.isLoading = true;

    if (this.isEditMode && this.editCustomerId) {
      this.updateCustomer();
    } else {
      this.createCustomer();
    }
  }

  createCustomer() {
    const payload = {
      user_id: this.userId,
      name: this.newCustomer.name,
      phone: this.newCustomer.phone,
      email: this.newCustomer.email,
      company_name: this.newCustomer.company_name,
      gstin: this.newCustomer.gstin,
      address_line1: this.newCustomer.address_line1,
      address_line2: this.newCustomer.address_line2,
      pincode: this.newCustomer.pincode,
      state: this.newCustomer.state,
      city: this.newCustomer.city,
      opening_balance: Number(this.newCustomer.opening_balance) || 0
    };

    fetch('https://billsezy.com/Api/add_customer.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(res => {
        this.isLoading = false;
        if (res.status === true) {
          this.getCustomers();
          this.closeForm();
          alert('Customer Added Successfully ✅');
        } else {
          alert(res.message || 'Something went wrong');
        }
      })
      .catch(err => {
        this.isLoading = false;
        alert('Server Error ❌');
      });
  }

  updateCustomer() {
    const payload = {
      id: this.editCustomerId,
      name: this.newCustomer.name,
      phone: this.newCustomer.phone,
      email: this.newCustomer.email,
      company_name: this.newCustomer.company_name,
      gstin: this.newCustomer.gstin,
      address_line1: this.newCustomer.address_line1,
      address_line2: this.newCustomer.address_line2,
      pincode: this.newCustomer.pincode,
      state: this.newCustomer.state,
      city: this.newCustomer.city,
      opening_balance: Number(this.newCustomer.opening_balance) || 0
    };

    fetch('https://billsezy.com/Api/update_customer.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(res => {
        this.isLoading = false;
        if (res.status === true) {
          this.getCustomers();
          this.closeForm();
          alert('Customer Updated Successfully ✅');
        } else {
          alert(res.message || 'Something went wrong');
        }
      })
      .catch(err => {
        this.isLoading = false;
        alert('Server Error ❌');
      });
  }

  // 🔥 DELETE CUSTOMER
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

  // 🔥 GET CUSTOMERS
  getCustomers() {
    fetch(`https://billsezy.com/Api/get_customers.php?user_id=${this.userId}`)
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

  // 🔥 SUMMARY
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