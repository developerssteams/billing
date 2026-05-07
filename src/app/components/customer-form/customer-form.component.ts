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
  
  // TDS / TCS / RCM
  tdsEnabled = false;
  tcsEnabled = false;
  rcmEnabled = false;

  tdsError: string = '';
  tcsError: string = '';

  // Delivery Address - Same as Billing
  sameAsBilling: boolean = false;

  // Loading State
  isLoading = false;

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
    balance_type: 'debit',
    opening_balance: 0,
    tds: '',
    tcs: '',
    rcm: 0,
    delivery_address_line1: '',
    delivery_address_line2: '',
    delivery_pincode: '',
    delivery_state: '',
    delivery_city: '',
    delivery_country: 'India'
  };

  ngOnInit(): void {
    // Initialization if needed
  }

  ngOnChanges(changes: SimpleChanges): void {
    // When editCustomerData changes, populate form
    if (changes['editCustomerData'] && this.editCustomerData && this.isEditMode) {
      this.populateFormForEdit();
    }
    
    // When form opens in add mode, reset
    if (changes['showForm'] && this.showForm && !this.isEditMode) {
      this.resetForm();
    }
  }

  // Populate form for edit mode
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
      balance_type: customer.balance_type || 'debit',
      opening_balance: customer.opening_balance || 0,
      tds: customer.tds || '',
      tcs: customer.tcs || '',
      rcm: customer.rcm || 0,
      delivery_address_line1: customer.delivery_address_line1 || '',
      delivery_address_line2: customer.delivery_address_line2 || '',
      delivery_pincode: customer.delivery_pincode || '',
      delivery_state: customer.delivery_state || '',
      delivery_city: customer.delivery_city || '',
      delivery_country: customer.delivery_country || 'India'
    };
    
    // Set toggle states
    this.tdsEnabled = !!customer.tds;
    this.tcsEnabled = !!customer.tcs;
    this.rcmEnabled = customer.rcm == 1;
    
    // Check if delivery address is same as billing
    this.sameAsBilling = this.isDeliverySameAsBilling();
  }

  // Check if delivery address matches billing address
  isDeliverySameAsBilling(): boolean {
    return this.customerData.delivery_address_line1 === this.customerData.address_line1 &&
           this.customerData.delivery_address_line2 === this.customerData.address_line2 &&
           this.customerData.delivery_pincode === this.customerData.pincode &&
           this.customerData.delivery_state === this.customerData.state &&
           this.customerData.delivery_city === this.customerData.city;
  }

  // Get Billing Address Preview
  getBillingAddressPreview(): string {
    const parts = [];
    if (this.customerData.address_line1) parts.push(this.customerData.address_line1);
    if (this.customerData.address_line2) parts.push(this.customerData.address_line2);
    if (this.customerData.city) parts.push(this.customerData.city);
    if (this.customerData.state) parts.push(this.customerData.state);
    if (this.customerData.pincode) parts.push(this.customerData.pincode);
    return parts.length ? parts.join(', ') : 'No billing address entered yet';
  }

  // When Same as Billing Checkbox changes
  onSameAsBillingChange() {
    if (this.sameAsBilling) {
      // Copy billing address to delivery address
      this.customerData.delivery_address_line1 = this.customerData.address_line1;
      this.customerData.delivery_address_line2 = this.customerData.address_line2;
      this.customerData.delivery_pincode = this.customerData.pincode;
      this.customerData.delivery_state = this.customerData.state;
      this.customerData.delivery_city = this.customerData.city;
      this.customerData.delivery_country = 'India';
    } else {
      // Clear delivery fields when unchecked
      this.customerData.delivery_address_line1 = '';
      this.customerData.delivery_address_line2 = '';
      this.customerData.delivery_pincode = '';
      this.customerData.delivery_state = '';
      this.customerData.delivery_city = '';
    }
  }

  // GST Check
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
          console.log("GST API Response:", res);
          this.gstLoading = false;

          if (res?.status && res?.data) {
            const data = res.data;

            this.customerData.company_name = data.tradeNam || data.lgnm || '';
            this.customerData.address_line1 = data.pradr?.addr?.bno || '';
            this.customerData.address_line2 = data.pradr?.addr?.st || '';
            this.customerData.city = data.pradr?.addr?.loc || '';
            this.customerData.pincode = data.pradr?.addr?.pncd || '';
            this.customerData.state = data.pradr?.addr?.stcd || '';

            // If sameAsBilling is true, also update delivery address
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
          console.error(error);
        }
      );
  }

  // Phone Input Restriction
  onlyNumber(event: any) {
    const input = event.target;
    input.value = input.value.replace(/[^0-9]/g, '').slice(0, 10);
  }

  // TDS Toggle
  toggleTDS() {
    this.tdsError = '';
    this.tcsError = '';

    if (!this.tdsEnabled && this.tcsEnabled) {
      this.tdsError = 'TCS and TDS cannot be applied together';
      return;
    }

    this.tdsEnabled = !this.tdsEnabled;
    
    if (!this.tdsEnabled) {
      this.customerData.tds = '';
    }
  }

  // TCS Toggle
  toggleTCS() {
    this.tdsError = '';
    this.tcsError = '';

    if (!this.tcsEnabled && this.tdsEnabled) {
      this.tcsError = 'TDS and TCS cannot be applied together';
      return;
    }

    this.tcsEnabled = !this.tcsEnabled;
    
    if (!this.tcsEnabled) {
      this.customerData.tcs = '';
    }
  }

  // RCM Toggle
  toggleRCM() {
    this.rcmEnabled = !this.rcmEnabled;
    this.customerData.rcm = this.rcmEnabled ? 1 : 0;
  }

  // Close Form
  closeForm() {
    this.formClosed.emit();
    this.resetForm();
  }

  // Reset Form
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
      balance_type: 'debit',
      opening_balance: 0,
      tds: '',
      tcs: '',
      rcm: 0,
      delivery_address_line1: '',
      delivery_address_line2: '',
      delivery_pincode: '',
      delivery_state: '',
      delivery_city: '',
      delivery_country: 'India'
    };
    this.tdsEnabled = false;
    this.tcsEnabled = false;
    this.rcmEnabled = false;
    this.sameAsBilling = false;
    this.tdsError = '';
    this.tcsError = '';
    this.gstError = '';
    this.isLoading = false;
  }

  // Submit Form
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

  createCustomer() {
    // Prepare delivery address (if same as billing, use billing address)
    let deliveryData = { ...this.customerData };
    
    if (this.sameAsBilling) {
      deliveryData.delivery_address_line1 = this.customerData.address_line1;
      deliveryData.delivery_address_line2 = this.customerData.address_line2;
      deliveryData.delivery_pincode = this.customerData.pincode;
      deliveryData.delivery_state = this.customerData.state;
      deliveryData.delivery_city = this.customerData.city;
    }

    const payload = {
      ...deliveryData,
      tds_enabled: this.tdsEnabled,
      tcs_enabled: this.tcsEnabled,
      rcm_enabled: this.rcmEnabled,
      tds: this.tdsEnabled ? this.customerData.tds : null,
      tcs: this.tcsEnabled ? this.customerData.tcs : null,
      rcm: this.rcmEnabled ? 1 : 0,
      same_as_billing: this.sameAsBilling
    };

    fetch('https://billsezy.com/Api/add_customer.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(res => {
        this.isLoading = false;

        if (res.status === true) {
          this.customerSaved.emit(res.data || payload);
          this.closeForm();
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
    // Prepare delivery address (if same as billing, use billing address)
    let deliveryData = { ...this.customerData };
    
    if (this.sameAsBilling) {
      deliveryData.delivery_address_line1 = this.customerData.address_line1;
      deliveryData.delivery_address_line2 = this.customerData.address_line2;
      deliveryData.delivery_pincode = this.customerData.pincode;
      deliveryData.delivery_state = this.customerData.state;
      deliveryData.delivery_city = this.customerData.city;
    }

    const payload = {
      id: this.editCustomerData.id,
      ...deliveryData,
      tds_enabled: this.tdsEnabled,
      tcs_enabled: this.tcsEnabled,
      rcm_enabled: this.rcmEnabled,
      tds: this.tdsEnabled ? this.customerData.tds : null,
      tcs: this.tcsEnabled ? this.customerData.tcs : null,
      rcm: this.rcmEnabled ? 1 : 0,
      same_as_billing: this.sameAsBilling
    };

    fetch('https://billsezy.com/Api/update_customer.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(res => {
        this.isLoading = false;

        if (res.status === true) {
          this.customerSaved.emit(res.data || payload);
          this.closeForm();
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