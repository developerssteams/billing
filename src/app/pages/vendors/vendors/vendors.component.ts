import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';

@Component({
  selector: 'app-vendors',
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './vendors.component.html',
  styleUrls: ['./vendors.component.scss']
})
export class VendorsComponent {
  constructor(private http: HttpClient) { }

  searchText = '';
  gstLoading: boolean = false;
  gstError: string = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;

  // Vendor List
  vendorData: any[] = [];
  filteredData: any[] = [];
  paginatedData: any[] = [];

  // Edit Mode
  isEditMode: boolean = false;
  editVendorId: number | null = null;

  // Form Data
  newVendor: any = {
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

  // User ID (get from localStorage or auth service)
  userId: number = 1; // Change this to actual logged-in user ID

  ngOnInit() {
    this.filteredData = this.vendorData;
    this.updatePaginatedData();
    this.getVendors();
  }
  // Get absolute amount for display (no sign)
  getDisplayAmount(amount: number): number {
    return Math.abs(amount);
  }
  // 🔹 Get balance type based on opening balance value
  getBalanceType(amount: number): string {
    return amount >= 0 ? 'debit' : 'credit';
  }

  // Get balance text
  getBalanceText(amount: number): string {
    return amount >= 0 ? 'You Collect ↓' : 'You Pay ↑';
  }

  // Get balance type class
  getBalanceClass(amount: number): string {
    return amount >= 0 ? 'collect' : 'pay';
  }

  // 🔹 GST Check
  checkGST(event: any) {
    let gstNumber = event.target.value.toUpperCase().trim();
    this.newVendor.gstin = gstNumber;
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
          console.log("GST API Response:", res);
          this.gstLoading = false;

          if (res?.status && res?.data) {
            const data = res.data;
            this.newVendor.company_name = data.tradeNam || data.lgnm || '';
            this.newVendor.address_line1 = data.pradr?.addr?.bno || '';
            this.newVendor.address_line2 = data.pradr?.addr?.st || '';
            this.newVendor.city = data.pradr?.addr?.loc || '';
            this.newVendor.pincode = data.pradr?.addr?.pncd || '';
            this.newVendor.state = data.pradr?.addr?.stcd || '';
          } else {
            this.gstError = res?.message || "Invalid GST Number / No Data Found";
          }
        },
        (error: any) => {
          this.gstLoading = false;
          this.gstError = "GST fetch failed";
          console.log(error);
        }
      );
  }

  // 🔹 Phone Restriction
  onlyNumber(event: any) {
    const input = event.target;
    input.value = input.value.replace(/[^0-9]/g, '').slice(0, 10);
    this.newVendor.phone = input.value;
  }

  // 🔹 SEARCH
  searchVendor() {
    this.filteredData = this.vendorData.filter((item: any) =>
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
  showForm = false;

  openForm(vendor?: any) {
    if (vendor) {
      // Edit Mode
      this.isEditMode = true;
      this.editVendorId = vendor.id;
      this.newVendor = {
        name: vendor.name || '',
        phone: vendor.phone || '',
        email: vendor.email || '',
        company_name: vendor.company_name || '',
        gstin: vendor.gstin || '',
        address_line1: vendor.address_line1 || '',
        address_line2: vendor.address_line2 || '',
        pincode: vendor.pincode || '',
        state: vendor.state || '',
        city: vendor.city || '',
        opening_balance: Math.abs(vendor.opening_balance) || 0  // Store absolute value
      };
    } else {
      // Add Mode
      this.isEditMode = false;
      this.editVendorId = null;
      this.resetForm();
    }
    this.showForm = true;
  }

  closeForm() {
    this.showForm = false;
    this.isEditMode = false;
    this.editVendorId = null;
    this.resetForm();
  }

  resetForm() {
    this.newVendor = {
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

  // 🔥 ADD/UPDATE VENDOR
  isLoading = false;

  addVendor() {
    if (!this.newVendor.name) {
      alert('Name required');
      return;
    }

    if (this.isLoading) return;
    this.isLoading = true;

    if (this.isEditMode && this.editVendorId) {
      this.updateVendor();
    } else {
      this.createVendor();
    }
  }

  createVendor() {
    // Positive amount means You Collect, Negative means You Pay
    const payload = {
      user_id: this.userId,
      name: this.newVendor.name,
      phone: this.newVendor.phone,
      email: this.newVendor.email,
      company_name: this.newVendor.company_name,
      gstin: this.newVendor.gstin,
      address_line1: this.newVendor.address_line1,
      address_line2: this.newVendor.address_line2,
      pincode: this.newVendor.pincode,
      state: this.newVendor.state,
      city: this.newVendor.city,
      opening_balance: Number(this.newVendor.opening_balance) || 0
    };

    console.log('Creating vendor:', payload);

    fetch('https://billsezy.com/Api/add_vendor.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(res => {
        this.isLoading = false;
        if (res.status === true) {
          this.getVendors();
          this.closeForm();
          alert('Vendor Added Successfully ✅');
        } else {
          alert(res.message || 'Something went wrong');
        }
      })
      .catch(err => {
        this.isLoading = false;
        console.error(err);
        alert('Server Error ❌');
      });
  }

  updateVendor() {
    const payload = {
      id: this.editVendorId,
      name: this.newVendor.name,
      phone: this.newVendor.phone,
      email: this.newVendor.email,
      company_name: this.newVendor.company_name,
      gstin: this.newVendor.gstin,
      address_line1: this.newVendor.address_line1,
      address_line2: this.newVendor.address_line2,
      pincode: this.newVendor.pincode,
      state: this.newVendor.state,
      city: this.newVendor.city,
      opening_balance: Number(this.newVendor.opening_balance) || 0
    };

    console.log('Updating vendor:', payload);

    fetch('https://billsezy.com/Api/update-vendor.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(res => {
        this.isLoading = false;
        if (res.status === true) {
          this.getVendors();
          this.closeForm();
          alert('Vendor Updated Successfully ✅');
        } else {
          alert(res.message || 'Something went wrong');
        }
      })
      .catch(err => {
        this.isLoading = false;
        console.error(err);
        alert('Server Error ❌');
      });
  }

  // 🔥 DELETE VENDOR
  deleteVendor(id: number, name: string) {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      const payload = {
        id: id,
        user_id: this.userId
      };

      fetch('https://billsezy.com/Api/delete_vendor.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(res => res.json())
        .then(res => {
          if (res.status === true) {
            this.getVendors();
            alert('Vendor deleted successfully ✅');
          } else {
            alert(res.message || 'Failed to delete vendor');
          }
        })
        .catch(err => {
          console.error('Error:', err);
          alert('Server Error ❌');
        });
    }
  }

  // 🔥 GET VENDORS
  getVendors() {
    fetch(`https://billsezy.com/Api/get_vendor.php?user_id=${this.userId}`)
      .then(res => res.json())
      .then(res => {
        if (res.status === true) {
          this.vendorData = res.data;
          this.filteredData = [...this.vendorData];
          this.currentPage = 1;
          this.updatePaginatedData();
        }
      })
      .catch(err => console.error(err));
  }

  // 🔥 SUMMARY - Positive = You Collect, Negative = You Pay
  getTotalPay(): number {
    // Total of negative balances (You Pay)
    return this.vendorData
      .filter(v => v.opening_balance < 0)
      .reduce((sum, v) => sum + Math.abs(Number(v.opening_balance || 0)), 0);
  }

  getTotalCollect(): number {
    // Total of positive balances (You Collect)
    return this.vendorData
      .filter(v => v.opening_balance > 0)
      .reduce((sum, v) => sum + Number(v.opening_balance || 0), 0);
  }
}