import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-form.component.html',
  styleUrls: ['./customer-form.component.scss']
})
export class CustomerFormComponent implements OnInit, OnChanges {

  @Input() showForm: boolean = false;
  @Input() isEditMode: boolean = false;
  @Input() editCustomerData: any = null;

  @Output() formClosed = new EventEmitter<void>();
  @Output() customerSaved = new EventEmitter<any>();

  constructor(private http: HttpClient) { }

  // GST Related
  gstLoading: boolean = false;
  gstError: string = '';

  // RCM Only
  rcmEnabled: boolean = false;

  // Delivery Address - Same as Billing
  sameAsBilling: boolean = false;

  // Loading State
  isLoading = false;

  // User ID
  userId: number = 1;

  // Form Data
  customerData: any = {
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
    opening_balance: 0,
    rcm: 0,
    delivery_address_line1: '',
    delivery_address_line2: '',
    delivery_pincode: '',
    delivery_state: '',
    delivery_city: '',
    delivery_country: 'India'
  };

  ngOnInit(): void { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editCustomerData'] && this.editCustomerData && this.isEditMode) {
      this.populateFormForEdit();
    }

    if (changes['showForm'] && this.showForm && !this.isEditMode) {
      this.resetForm();
    }
  }

  populateFormForEdit() {
    const customer = this.editCustomerData;

    this.customerData = {
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
      // 🔥 IMPORTANT: Show absolute value in input, but store original sign
      opening_balance: Math.abs(customer.opening_balance || 0),
      rcm: customer.rcm || 0,
      delivery_address_line1: customer.delivery_address_line1 || '',
      delivery_address_line2: customer.delivery_address_line2 || '',
      delivery_pincode: customer.delivery_pincode || '',
      delivery_state: customer.delivery_state || '',
      delivery_city: customer.delivery_city || '',
      delivery_country: customer.delivery_country || 'India'
    };

    // 🔥 Store the original sign separately for edit mode
    this.originalBalanceSign = customer.opening_balance < 0 ? -1 : 1;
    
    this.rcmEnabled = customer.rcm == 1;
    this.sameAsBilling = this.isDeliverySameAsBilling();
  }

  // Store original sign for edit mode
  originalBalanceSign: number = 1;

  isDeliverySameAsBilling(): boolean {
    return this.customerData.delivery_address_line1 === this.customerData.address_line1 &&
      this.customerData.delivery_address_line2 === this.customerData.address_line2 &&
      this.customerData.delivery_pincode === this.customerData.pincode &&
      this.customerData.delivery_state === this.customerData.state &&
      this.customerData.delivery_city === this.customerData.city;
  }

  getBillingAddressPreview(): string {
    const parts = [];
    if (this.customerData.address_line1) parts.push(this.customerData.address_line1);
    if (this.customerData.address_line2) parts.push(this.customerData.address_line2);
    if (this.customerData.city) parts.push(this.customerData.city);
    if (this.customerData.state) parts.push(this.customerData.state);
    if (this.customerData.pincode) parts.push(this.customerData.pincode);
    return parts.length ? parts.join(', ') : 'No billing address entered yet';
  }

  onSameAsBillingChange() {
    if (this.sameAsBilling) {
      this.customerData.delivery_address_line1 = this.customerData.address_line1;
      this.customerData.delivery_address_line2 = this.customerData.address_line2;
      this.customerData.delivery_pincode = this.customerData.pincode;
      this.customerData.delivery_state = this.customerData.state;
      this.customerData.delivery_city = this.customerData.city;
    } else {
      this.customerData.delivery_address_line1 = '';
      this.customerData.delivery_address_line2 = '';
      this.customerData.delivery_pincode = '';
      this.customerData.delivery_state = '';
      this.customerData.delivery_city = '';
    }
  }

  checkGST(event: any) {
    let gstNumber = event.target.value.toUpperCase();
    this.customerData.gstin = gstNumber;

    if (gstNumber.length === 15) {
      this.fetchGSTDetails(gstNumber);
    } else {
      this.gstError = '';
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
            this.customerData.company_name = data.tradeNam || data.lgnm || '';
            this.customerData.address_line1 = data.pradr?.addr?.bno || '';
            this.customerData.address_line2 = data.pradr?.addr?.st || '';
            this.customerData.city = data.pradr?.addr?.loc || '';
            this.customerData.pincode = data.pradr?.addr?.pncd || '';
            this.customerData.state = data.pradr?.addr?.stcd || '';

            if (this.sameAsBilling) {
              this.onSameAsBillingChange();
            }
          } else {
            this.gstError = "Invalid GST Number / No Data Found";
          }
        },
        (error: any) => {
          this.gstLoading = false;
          this.gstError = "GST fetch failed";
        }
      );
  }

  onlyNumber(event: any) {
    const input = event.target;
    input.value = input.value.replace(/[^0-9]/g, '').slice(0, 10);
    this.customerData.phone = input.value;
  }

  toggleRCM() {
    this.rcmEnabled = !this.rcmEnabled;
    this.customerData.rcm = this.rcmEnabled ? 1 : 0;
    console.log('RCM Status:', this.rcmEnabled ? 'Enabled' : 'Disabled');
  }

  closeForm() {
    this.formClosed.emit();
    this.resetForm();
  }

  resetForm() {
    this.customerData = {
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
      opening_balance: 0,
      rcm: 0,
      delivery_address_line1: '',
      delivery_address_line2: '',
      delivery_pincode: '',
      delivery_state: '',
      delivery_city: '',
      delivery_country: 'India'
    };
    this.rcmEnabled = false;
    this.sameAsBilling = false;
    this.gstError = '';
    this.isLoading = false;
    this.originalBalanceSign = 1;
  }

  onSubmit() {
    if (!this.customerData.name) {
      alert('Name required');
      return;
    }

    if (this.isLoading) return;
    this.isLoading = true;

    if (this.isEditMode && this.editCustomerData?.id) {
      this.updateCustomer();
    } else {
      this.createCustomer();
    }
  }

  // 🔥 Get opening balance with sign
  getOpeningBalanceWithSign(): number {
    let amount = Number(this.customerData.opening_balance) || 0;
    
    // If in edit mode and original was negative, keep it negative
    if (this.isEditMode && this.originalBalanceSign === -1 && amount > 0) {
      return -amount;
    }
    
    // For new customer: positive = You Collect, negative = You Pay
    // User can directly enter negative value in input
    return amount;
  }

  createCustomer() {
    // 🔥 Get opening balance with sign (user can enter negative directly)
    let openingBalance = Number(this.customerData.opening_balance) || 0;

    const payload = {
      user_id: this.userId,
      name: this.customerData.name,
      phone: this.customerData.phone,
      email: this.customerData.email,
      company_name: this.customerData.company_name,
      gstin: this.customerData.gstin,
      address_line1: this.customerData.address_line1,
      address_line2: this.customerData.address_line2,
      pincode: this.customerData.pincode,
      state: this.customerData.state,
      city: this.customerData.city,
      delivery_address_line1: this.sameAsBilling ? this.customerData.address_line1 : this.customerData.delivery_address_line1,
      delivery_address_line2: this.sameAsBilling ? this.customerData.address_line2 : this.customerData.delivery_address_line2,
      delivery_pincode: this.sameAsBilling ? this.customerData.pincode : this.customerData.delivery_pincode,
      delivery_state: this.sameAsBilling ? this.customerData.state : this.customerData.delivery_state,
      delivery_city: this.sameAsBilling ? this.customerData.city : this.customerData.delivery_city,
      delivery_country: 'India',
      same_as_billing: this.sameAsBilling ? 1 : 0,
      opening_balance: openingBalance,  // 🔥 Send as is (positive or negative)
      rcm: this.rcmEnabled ? 1 : 0
    };

    console.log('Creating customer with opening_balance:', openingBalance);

    fetch('https://billsezy.com/Api/add_customer.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(res => {
        this.isLoading = false;
        if (res.status === true) {
          this.customerSaved.emit(res.data || payload);
          this.closeForm();
          alert('Customer Added Successfully ✅');
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

  updateCustomer() {
    // 🔥 Get opening balance with sign
    let openingBalance = Number(this.customerData.opening_balance) || 0;

    const payload = {
      id: this.editCustomerData.id,
      user_id: this.userId,
      name: this.customerData.name,
      phone: this.customerData.phone,
      email: this.customerData.email,
      company_name: this.customerData.company_name,
      gstin: this.customerData.gstin,
      address_line1: this.customerData.address_line1,
      address_line2: this.customerData.address_line2,
      pincode: this.customerData.pincode,
      state: this.customerData.state,
      city: this.customerData.city,
      delivery_address_line1: this.sameAsBilling ? this.customerData.address_line1 : this.customerData.delivery_address_line1,
      delivery_address_line2: this.sameAsBilling ? this.customerData.address_line2 : this.customerData.delivery_address_line2,
      delivery_pincode: this.sameAsBilling ? this.customerData.pincode : this.customerData.delivery_pincode,
      delivery_state: this.sameAsBilling ? this.customerData.state : this.customerData.delivery_state,
      delivery_city: this.sameAsBilling ? this.customerData.city : this.customerData.delivery_city,
      delivery_country: 'India',
      same_as_billing: this.sameAsBilling ? 1 : 0,
      opening_balance: openingBalance,  // 🔥 Send as is (positive or negative)
      rcm: this.rcmEnabled ? 1 : 0
    };

    console.log('Updating customer with opening_balance:', openingBalance);

    fetch('https://billsezy.com/Api/update_customer.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(res => {
        this.isLoading = false;
        if (res.status === true) {
          // 🔥 Emit the updated data from response
          this.customerSaved.emit(res.data || payload);
          this.closeForm();
          alert('Customer Updated Successfully ✅');
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
}