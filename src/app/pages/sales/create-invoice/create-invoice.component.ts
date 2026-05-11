import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CustomerFormComponent } from '../../../components/customer-form/customer-form.component';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-create-invoice',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    CustomerFormComponent
  ],
  templateUrl: './create-invoice.component.html',
  styleUrls: ['./create-invoice.component.scss'],
})
export class CreateInvoiceComponent implements OnInit {

  // Customer
  customers: any[] = [];
  filteredCustomers: any[] = [];
  searchText: string = '';
  selectedCustomer: any = null;
  showDropdown: boolean = false;

  // Company Details
  companyDetails: any = null;
  companyState: string = '';
  companyName: string = '';
  companyGSTIN: string = '';

  // Category
  categories: any[] = [];
  selectedCategory: string = '';

  // Product
  products: any[] = [];
  filteredProducts: any[] = [];
  selectedProduct: any = null;
  productSearchText: string = '';
  showProductDropdown: boolean = false;

  // Selected Quantity
  selectedQty: number = 1;

  // Payment Options
  paymentMethod: string = 'Cash';
  paidAmount: number = 0;
  isFullPaymentChecked: boolean = false;

  // Discount on product
  discountPercent: number = 0;

  // Bill Items Array
  billItems: any[] = [];
  globalDiscountPercent: number = 0;
  originalGrandTotal: number = 0;
  globalDiscountAmount: number = 0;

  // Additional Charges and Round Off
  additionalCharges: number = 0;
  roundOff: boolean = false;
  roundOffValue: number = 0;

  // Tax Rates
  cgstRate: number = 0;
  sgstRate: number = 0;
  igstRate: number = 0;
  isInterState: boolean = false;

  // Dates
  invoiceDate: string = '';
  dueDate: string = '';

  // Reference Number
  referenceNumber: string = '';

  // Customer Form Modal Control
  showCustomerForm: boolean = false;
  isCustomerEditMode: boolean = false;
  selectedCustomerForEdit: any = null;

  // Current Item Details
  currentItem = {
    product: null as any,
    quantity: 1,
    unitPrice: 0,
    discountPercent: 0,
    discountAmount: 0,
    totalAmount: 0
  };

  isEditingDeliveryAddress: boolean = false;
  isSaving: boolean = false;
  editDeliveryAddress: any = {
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
    country: ''
  };

  // API URLs
  customerApiUrl = 'https://billsezy.com/Api/get_customers.php';
  categoryApiUrl = 'https://billsezy.com/Api/get_category.php';
  productApiUrl = 'https://billsezy.com/Api/get_product.php';
  saveApiUrl = 'https://billsezy.com/Api/add-invoice.php';
  companyApiUrl = 'https://billsezy.com/Api/get_company_details.php';
  updateCustomerApiUrl = 'https://billsezy.com/Api/update_customer_address.php';

  get userId(): number {
    const userId = this.authService.getUserId();
    return userId || 1;
  }

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    console.log("Current User ID:", this.userId);
    this.getCompanyDetails();
    this.getCustomers();
    this.getCategories();
    this.getProducts();
    this.setDefaultDates();
  }

  // ================= FULL PAYMENT TOGGLE =================
  onFullPaymentToggle() {
    if (this.isFullPaymentChecked) {
      this.paidAmount = this.getFinalTotalWithRoundOff();
    } else {
      this.paidAmount = 0;
    }
  }

  onPaidAmountChange() {
    const totalAmount = this.getFinalTotalWithRoundOff();
    if (this.paidAmount > totalAmount) {
      this.paidAmount = totalAmount;
    }
    if (this.paidAmount < 0) {
      this.paidAmount = 0;
    }
    this.paidAmount = this.roundToTwoDecimals(this.paidAmount);

    // Uncheck full payment checkbox if amount is not equal to total
    if (this.paidAmount !== totalAmount) {
      this.isFullPaymentChecked = false;
    } else if (this.paidAmount === totalAmount && this.paidAmount > 0) {
      this.isFullPaymentChecked = true;
    }
  }

  getCompanyDetails() {
    const userId = this.userId;
    this.http.get<any>(`${this.companyApiUrl}?user_id=${userId}`).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.companyDetails = response.data;
          this.companyState = response.data.state || '';
          this.companyName = response.data.company_name || response.data.trade_name || '';
          this.companyGSTIN = response.data.gstin || '';
        }
      },
      error: (err) => console.error('Error fetching company details:', err)
    });
  }

  selectCustomer(customer: any) {
    this.selectedCustomer = customer;
    this.searchText = customer.company_name || customer.name;
    this.showDropdown = false;

    if (!customer.delivery_address_line1 && customer.address_line1) {
      this.selectedCustomer.delivery_address_line1 = customer.address_line1;
      this.selectedCustomer.delivery_address_line2 = customer.address_line2;
      this.selectedCustomer.delivery_city = customer.city;
      this.selectedCustomer.delivery_state = customer.state;
      this.selectedCustomer.delivery_pincode = customer.pincode;
      this.selectedCustomer.delivery_country = customer.country || 'India';
    }

    this.checkGSTType();
    this.refreshCalculations();
  }

  checkGSTType() {
    if (!this.selectedCustomer) {
      this.isInterState = false;
      return;
    }

    const customerState = this.selectedCustomer.state || this.selectedCustomer.delivery_state || '';
    const companyState = this.companyState || '';

    if (companyState && customerState) {
      this.isInterState = companyState.trim().toLowerCase() !== customerState.trim().toLowerCase();
    } else {
      this.isInterState = false;
    }

    this.calculateTaxRatesForAllItems();
  }

  calculateTaxRatesForAllItems() {
    let taxRate = 18;
    if (this.billItems.length > 0) {
      taxRate = this.billItems[0].gstRate || 18;
    }

    if (this.isInterState) {
      this.igstRate = taxRate;
      this.cgstRate = 0;
      this.sgstRate = 0;
    } else {
      this.cgstRate = taxRate / 2;
      this.sgstRate = taxRate / 2;
      this.igstRate = 0;
    }

    this.billItems.forEach(item => {
      if (this.isInterState) {
        item.igstRate = item.gstRate;
        item.cgstRate = 0;
        item.sgstRate = 0;
      } else {
        item.cgstRate = item.gstRate / 2;
        item.sgstRate = item.gstRate / 2;
        item.igstRate = 0;
      }
      this.recalculateItemTotal(item);
    });

    this.refreshCalculations();
  }

  setDefaultDates() {
    this.invoiceDate = new Date().toISOString().split('T')[0];
    const dueDateObj = new Date();
    dueDateObj.setDate(dueDateObj.getDate() + 30);
    this.dueDate = dueDateObj.toISOString().split('T')[0];
  }

  roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }

  updatePaidAmount() {
    // Handled by onFullPaymentToggle
  }

  refreshCalculations() {
    this.calculateRoundOff();
    if (this.isFullPaymentChecked) {
      this.paidAmount = this.getFinalTotalWithRoundOff();
    }
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.input-wrapper') && !target.closest('.product-input-wrapper')) {
      this.showDropdown = false;
      this.showProductDropdown = false;
    }
  }

  getCustomers() {
    this.http.get<any>(`${this.customerApiUrl}?user_id=${this.userId}`).subscribe({
      next: (response) => {
        if (response.status) {
          this.customers = response.data;
          this.filteredCustomers = [...response.data];
        }
      },
      error: (err) => console.error('Error fetching customers:', err)
    });
  }

  openDropdown() {
    this.showDropdown = true;
    this.filteredCustomers = [...this.customers];
  }

  searchCustomer() {
    const searchValue = this.searchText.toLowerCase();
    this.filteredCustomers = this.customers.filter(customer =>
      customer.name?.toLowerCase().includes(searchValue) ||
      customer.company_name?.toLowerCase().includes(searchValue) ||
      customer.gstin?.toLowerCase().includes(searchValue)
    );
    this.showDropdown = true;
  }

  clearCustomer() {
    this.selectedCustomer = null;
    this.searchText = '';
    this.filteredCustomers = [...this.customers];
    this.checkGSTType();
    this.refreshCalculations();
  }

  openCustomerForm() {
    this.showCustomerForm = true;
    this.isCustomerEditMode = false;
    this.selectedCustomerForEdit = null;
    this.showDropdown = false;
  }

  closeCustomerForm() {
    this.showCustomerForm = false;
    this.isCustomerEditMode = false;
    this.selectedCustomerForEdit = null;
  }

  onCustomerSaved(customer: any) {
    this.getCustomers();
    setTimeout(() => {
      const foundCustomer = this.customers.find(c =>
        c.name === customer.name || c.company_name === customer.company_name || c.id === customer.id
      );
      if (foundCustomer) this.selectCustomer(foundCustomer);
    }, 500);
    this.closeCustomerForm();
  }

  getCategories() {
    this.http.get<any>(`${this.categoryApiUrl}?user_id=${this.userId}`).subscribe({
      next: (response) => {
        if (response.status) this.categories = response.data;
      },
      error: (err) => console.error('Error fetching categories:', err)
    });
  }

  filterProductsByCategory() {
    if (!this.selectedCategory || this.selectedCategory === '') {
      this.filteredProducts = [...this.products];
    } else {
      this.filteredProducts = this.products.filter(product =>
        product.category?.trim().toLowerCase() === this.selectedCategory.trim().toLowerCase()
      );
    }
    this.productSearchText = '';
    this.selectedProduct = null;
    this.resetCurrentItem();
    this.selectedQty = 1;
    this.discountPercent = 0;
  }

  getProducts() {
    this.http.get<any>(`${this.productApiUrl}?user_id=${this.userId}`).subscribe({
      next: (response) => {
        if (response.status) {
          this.products = response.data;
          this.filteredProducts = [...response.data];
        }
      },
      error: (err) => console.error('Error fetching products:', err)
    });
  }

  openProductDropdown() {
    this.showProductDropdown = true;
    this.filterProductsByCategory();
  }

  searchProducts() {
    const searchValue = this.productSearchText.toLowerCase();
    let categoryProducts = [...this.products];
    if (this.selectedCategory && this.selectedCategory !== '') {
      categoryProducts = this.products.filter(product =>
        product.category?.trim().toLowerCase() === this.selectedCategory.trim().toLowerCase()
      );
    }
    this.filteredProducts = categoryProducts.filter(product =>
      product.name?.toLowerCase().includes(searchValue)
    );
    this.showProductDropdown = true;
  }

  selectProduct(product: any) {
    this.selectedProduct = product;
    this.productSearchText = product.name;
    this.showProductDropdown = false;
    this.currentItem.product = product;
    this.currentItem.unitPrice = product.sell || 0;
    this.currentItem.quantity = this.selectedQty;
    this.currentItem.discountPercent = 0;
    this.currentItem.discountAmount = 0;
    this.currentItem.totalAmount = this.currentItem.unitPrice * this.currentItem.quantity;
    this.discountPercent = 0;
  }

  clearProduct() {
    this.selectedProduct = null;
    this.productSearchText = '';
    this.showProductDropdown = false;
    this.resetCurrentItem();
    this.selectedQty = 1;
    this.discountPercent = 0;
    this.filterProductsByCategory();
  }

  updateItemUnitPrice(item: any, newPrice: number) {
    if (isNaN(newPrice)) newPrice = 0;
    if (newPrice < 0) newPrice = 0;
    item.unitPrice = newPrice;
    this.recalculateItemTotal(item);
    this.refreshCalculations();
  }

  resetCurrentItem() {
    this.currentItem = {
      product: null,
      quantity: 1,
      unitPrice: 0,
      discountPercent: 0,
      discountAmount: 0,
      totalAmount: 0
    };
  }

  extractTaxRateFromProduct(product: any): number {
    if (product.gst_rate !== null && product.gst_rate !== undefined && product.gst_rate !== '') {
      return parseFloat(product.gst_rate);
    }
    return 18;
  }

  addToBill() {
    const productToAdd = this.currentItem.product || this.selectedProduct;
    if (!productToAdd) {
      alert('Please select a product first!');
      return;
    }

    const taxRate = this.extractTaxRateFromProduct(productToAdd);
    const quantity = this.selectedQty > 0 ? this.selectedQty : 1;
    const discountValue = this.discountPercent;
    const unitPrice = productToAdd.sell || 0;
    const subtotal = unitPrice * quantity;

    let discountAmount = (subtotal * discountValue) / 100;
    const taxableValue = this.roundToTwoDecimals(subtotal - discountAmount);

    let cgstRate = 0, sgstRate = 0, igstRate = 0;
    if (this.isInterState) {
      igstRate = taxRate;
    } else {
      cgstRate = taxRate / 2;
      sgstRate = taxRate / 2;
    }

    const cgstAmount = (taxableValue * cgstRate) / 100;
    const sgstAmount = (taxableValue * sgstRate) / 100;
    const igstAmount = (taxableValue * igstRate) / 100;
    const totalTax = cgstAmount + sgstAmount + igstAmount;
    const totalAmount = taxableValue + totalTax;

    const billItem = {
      id: Date.now(),
      productId: productToAdd.id,
      productName: productToAdd.name,
      hsnCode: productToAdd.hsn || 'N/A',
      quantity: quantity,
      unitPrice: unitPrice,
      discountValue: discountValue,
      discountType: 'percentage',
      discountAmount: this.roundToTwoDecimals(discountAmount),
      subtotal: this.roundToTwoDecimals(subtotal),
      taxableValue: taxableValue,
      gstRate: taxRate,
      cgstRate: cgstRate,
      sgstRate: sgstRate,
      igstRate: igstRate,
      cgstAmount: this.roundToTwoDecimals(cgstAmount),
      sgstAmount: this.roundToTwoDecimals(sgstAmount),
      igstAmount: this.roundToTwoDecimals(igstAmount),
      totalTax: this.roundToTwoDecimals(totalTax),
      totalAmount: this.roundToTwoDecimals(totalAmount),
      category: productToAdd.category,
      unit: productToAdd.unit
    };

    this.billItems.push(billItem);
    this.clearProduct();
    this.selectedQty = 1;
    this.discountPercent = 0;
    this.resetCurrentItem();
    this.refreshCalculations();
  }

  removeItem(itemId: number) {
    this.billItems = this.billItems.filter(item => item.id !== itemId);
    if (this.billItems.length === 0) {
      this.cgstRate = 0;
      this.sgstRate = 0;
      this.igstRate = 0;
    } else {
      this.calculateTaxRatesForAllItems();
    }
    this.refreshCalculations();
  }

  onDiscountValueChange(item: any) {
    let discountValue = parseFloat(item.discountValue);
    if (isNaN(discountValue)) discountValue = 0;
    if (discountValue < 0) discountValue = 0;
    if (item.discountType === 'percentage' && discountValue > 100) discountValue = 100;
    item.discountValue = discountValue;
    this.recalculateItemTotal(item);
    this.refreshCalculations();
  }

  onDiscountTypeChange(item: any) {
    if (item.discountType === 'percentage' && item.discountValue > 100) item.discountValue = 100;
    this.recalculateItemTotal(item);
    this.refreshCalculations();
  }

  recalculateItemTotal(item: any) {
    const subtotal = item.unitPrice * item.quantity;
    let discountAmount = 0;

    if (item.discountType === 'percentage') {
      discountAmount = (subtotal * item.discountValue) / 100;
    } else {
      discountAmount = item.discountValue;
      if (discountAmount > subtotal) discountAmount = subtotal;
    }

    const taxableValue = this.roundToTwoDecimals(subtotal - discountAmount);

    let cgstAmount = 0, sgstAmount = 0, igstAmount = 0;

    if (this.isInterState) {
      igstAmount = (taxableValue * item.gstRate) / 100;
      item.igstRate = item.gstRate;
      item.cgstRate = 0;
      item.sgstRate = 0;
    } else {
      cgstAmount = (taxableValue * (item.gstRate / 2)) / 100;
      sgstAmount = (taxableValue * (item.gstRate / 2)) / 100;
      item.cgstRate = item.gstRate / 2;
      item.sgstRate = item.gstRate / 2;
      item.igstRate = 0;
    }

    const totalTax = cgstAmount + sgstAmount + igstAmount;
    const totalAmount = taxableValue + totalTax;

    item.subtotal = this.roundToTwoDecimals(subtotal);
    item.discountAmount = this.roundToTwoDecimals(discountAmount);
    item.taxableValue = taxableValue;
    item.cgstAmount = this.roundToTwoDecimals(cgstAmount);
    item.sgstAmount = this.roundToTwoDecimals(sgstAmount);
    item.igstAmount = this.roundToTwoDecimals(igstAmount);
    item.totalTax = this.roundToTwoDecimals(totalTax);
    item.totalAmount = this.roundToTwoDecimals(totalAmount);
  }

  getSubTotal(): number {
    return this.roundToTwoDecimals(this.billItems.reduce((sum, item) => sum + item.subtotal, 0));
  }

  getTotalItemDiscount(): number {
    return this.roundToTwoDecimals(this.billItems.reduce((sum, item) => sum + item.discountAmount, 0));
  }

  getTaxableAmount(): number {
    return this.roundToTwoDecimals(this.billItems.reduce((sum, item) => sum + item.taxableValue, 0));
  }

  getTotalCGSTAmount(): number {
    if (!this.isInterState) {
      return this.roundToTwoDecimals(this.billItems.reduce((sum, item) => sum + (item.cgstAmount || 0), 0));
    }
    return 0;
  }

  getTotalSGSTAmount(): number {
    if (!this.isInterState) {
      return this.roundToTwoDecimals(this.billItems.reduce((sum, item) => sum + (item.sgstAmount || 0), 0));
    }
    return 0;
  }

  getTotalIGSTAmount(): number {
    if (this.isInterState) {
      return this.roundToTwoDecimals(this.billItems.reduce((sum, item) => sum + (item.igstAmount || 0), 0));
    }
    return 0;
  }

  getTotalTaxAmount(): number {
    return this.getTotalCGSTAmount() + this.getTotalSGSTAmount() + this.getTotalIGSTAmount();
  }

  getTotalAmount(): number {
    return this.roundToTwoDecimals(this.getTaxableAmount() + this.getTotalTaxAmount());
  }

  getTotalAfterAdditionalCharges(): number {
    return this.roundToTwoDecimals(this.getTotalAmount() + this.additionalCharges);
  }

  calculateRoundOff(): number {
    const total = this.getTotalAfterAdditionalCharges();
    const roundedTotal = Math.round(total);
    this.roundOffValue = this.roundToTwoDecimals(roundedTotal - total);
    return this.roundOffValue;
  }

  getFinalTotalWithRoundOff(): number {
    let total = this.getTotalAfterAdditionalCharges();
    if (this.roundOff) total = Math.round(total);
    return this.roundToTwoDecimals(total);
  }

  onAdditionalChargesChange() {
    if (this.additionalCharges < 0) this.additionalCharges = 0;
    this.additionalCharges = this.roundToTwoDecimals(this.additionalCharges);
    this.refreshCalculations();
  }

  onRoundOffToggle(event: any) {
    this.roundOff = event.target.checked;
    this.refreshCalculations();
  }

  updateQuantity(item: any, newQuantity: number) {
    if (newQuantity < 1) return;
    item.quantity = newQuantity;
    this.recalculateItemTotal(item);
    this.refreshCalculations();
  }

  getItemCGST(item: any): number {
    return item.cgstAmount || 0;
  }

  getItemSGST(item: any): number {
    return item.sgstAmount || 0;
  }

  getItemIGST(item: any): number {
    return item.igstAmount || 0;
  }

  getItemTotalWithTax(item: any): number {
    return item.totalAmount || 0;
  }

  getTotalTaxableAmount(): number {
    return this.getTaxableAmount();
  }

  getTotalItemsCount(): number {
    return this.billItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  getBillingAddress(): string {
    if (!this.selectedCustomer) return '';
    const parts = [];
    if (this.selectedCustomer.address_line1) parts.push(this.selectedCustomer.address_line1);
    if (this.selectedCustomer.address_line2) parts.push(this.selectedCustomer.address_line2);
    if (this.selectedCustomer.city) parts.push(this.selectedCustomer.city);
    if (this.selectedCustomer.state) parts.push(this.selectedCustomer.state);
    if (this.selectedCustomer.pincode) parts.push(this.selectedCustomer.pincode);
    return parts.join(', ') || 'Address not available';
  }

  getDeliveryAddress(): string {
    if (!this.selectedCustomer) return '';
    const parts = [];
    if (this.selectedCustomer.delivery_address_line1) parts.push(this.selectedCustomer.delivery_address_line1);
    if (this.selectedCustomer.delivery_address_line2) parts.push(this.selectedCustomer.delivery_address_line2);
    if (this.selectedCustomer.delivery_city) parts.push(this.selectedCustomer.delivery_city);
    if (this.selectedCustomer.delivery_state) parts.push(this.selectedCustomer.delivery_state);
    if (this.selectedCustomer.delivery_pincode) parts.push(this.selectedCustomer.delivery_pincode);
    return parts.length ? parts.join(', ') : 'No delivery address added.';
  }

  toggleEditDeliveryAddress() {
    if (!this.selectedCustomer) return;
    this.editDeliveryAddress = {
      address_line1: this.selectedCustomer.delivery_address_line1 || '',
      address_line2: this.selectedCustomer.delivery_address_line2 || '',
      city: this.selectedCustomer.delivery_city || '',
      state: this.selectedCustomer.delivery_state || '',
      pincode: this.selectedCustomer.delivery_pincode || '',
      country: this.selectedCustomer.delivery_country || 'India'
    };
    this.isEditingDeliveryAddress = true;
  }

  cancelEditDeliveryAddress() {
    this.isEditingDeliveryAddress = false;
  }

  saveDeliveryAddress() {
    if (!this.selectedCustomer) return;
    this.isSaving = true;
    const payload = {
      customer_id: this.selectedCustomer.id,
      user_id: this.userId,
      delivery_address_line1: this.editDeliveryAddress.address_line1,
      delivery_address_line2: this.editDeliveryAddress.address_line2,
      delivery_city: this.editDeliveryAddress.city,
      delivery_state: this.editDeliveryAddress.state,
      delivery_pincode: this.editDeliveryAddress.pincode,
      delivery_country: this.editDeliveryAddress.country
    };

    this.http.post(this.updateCustomerApiUrl, payload).subscribe({
      next: (response: any) => {
        this.isSaving = false;
        if (response.status === true || response.success) {
          this.selectedCustomer.delivery_address_line1 = this.editDeliveryAddress.address_line1;
          this.selectedCustomer.delivery_address_line2 = this.editDeliveryAddress.address_line2;
          this.selectedCustomer.delivery_city = this.editDeliveryAddress.city;
          this.selectedCustomer.delivery_state = this.editDeliveryAddress.state;
          this.selectedCustomer.delivery_pincode = this.editDeliveryAddress.pincode;
          this.selectedCustomer.delivery_country = this.editDeliveryAddress.country;
          alert('Delivery address updated successfully!');
          this.isEditingDeliveryAddress = false;
        } else {
          alert('Error: ' + (response.message || 'Failed to update address'));
        }
      },
      error: (err) => {
        this.isSaving = false;
        alert('Error: ' + (err.message || 'Connection failed'));
      }
    });
  }

  goBack() {
    this.router.navigate(['/sales/add-invoice']);
  }

  cancel() {
    if (this.billItems.length > 0 || this.selectedCustomer) {
      if (confirm('Are you sure you want to cancel? All unsaved data will be lost.')) {
        this.router.navigate(['/sales/add-invoice']);
      }
    } else {
      this.router.navigate(['/sales/add-invoice']);
    }
  }

  save() {
    if (this.billItems.length === 0) {
      alert('Please add at least one product!');
      return;
    }
    if (!this.selectedCustomer) {
      alert('Please select a customer!');
      return;
    }

    const remainingAmount = this.getFinalTotalWithRoundOff() - this.paidAmount;
    const invoiceStatus = remainingAmount === 0 ? 'Paid' : (this.paidAmount > 0 ? 'Partially Paid' : 'Unpaid');

    // Format product items for database
    const productItems = this.billItems.map((item: any) => ({
      id: item.productId,
      name: item.productName,
      hsn: item.hsnCode,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      discount_type: item.discountType,
      discount_value: item.discountValue,
      discount_amount: item.discountAmount,
      taxable_value: item.taxableValue,
      gst_rate: item.gstRate,
      cgst_rate: item.cgstRate,
      cgst_amount: item.cgstAmount,
      sgst_rate: item.sgstRate,
      sgst_amount: item.sgstAmount,
      igst_rate: item.igstRate,
      igst_amount: item.igstAmount,
      total_amount: item.totalAmount,
      category: item.category,
      unit: item.unit
    }));

    // ✅ CORRECT PAYLOAD STRUCTURE - Matches database columns
    const payload = {
      // Basic Info
      user_id: this.userId,
      bill_no: 'INV-' + Date.now(),
      invoice_date: this.invoiceDate,
      due_date: this.dueDate,
      reference_number: this.referenceNumber || '',

      // Customer Info
      customer_id: this.selectedCustomer?.id || 0,
      customer_name: this.selectedCustomer?.company_name || this.selectedCustomer?.name,
      customer_gstin: this.selectedCustomer?.gstin || '',
      customer_phone: this.selectedCustomer?.phone || '',
      customer_email: this.selectedCustomer?.email || '',
      customer_address: this.getBillingAddress(),
      customer_city: this.selectedCustomer?.city || '',
      customer_state: this.selectedCustomer?.state || '',
      customer_pincode: this.selectedCustomer?.pincode || '',

      // Company Info
      company_name: this.companyName,
      company_state: this.companyState,
      company_gstin: this.companyGSTIN,

      // Tax Details
      is_inter_state: this.isInterState ? 1 : 0,
      cgst_rate: this.cgstRate,
      cgst_amount: this.getTotalCGSTAmount(),
      sgst_rate: this.sgstRate,
      sgst_amount: this.getTotalSGSTAmount(),
      igst_rate: this.igstRate,
      igst_amount: this.getTotalIGSTAmount(),
      total_tax_amount: this.getTotalTaxAmount(),

      // Amount Details
      sub_total: this.getSubTotal(),
      discount: this.getTotalItemDiscount(),
      taxable_amount: this.getTaxableAmount(),
      additional_charges: this.additionalCharges,
      total_after_charges: this.getTotalAfterAdditionalCharges(),
      round_off_enabled: this.roundOff ? 1 : 0,
      round_off_value: this.calculateRoundOff(),
      grand_total: this.getFinalTotalWithRoundOff(),

      // Payment Details
      payment_option: this.paymentMethod,
      paid_amount: this.paidAmount,
      remaining_amount: remainingAmount,
      status: invoiceStatus,

      // Products
      product_items: JSON.stringify(productItems),
      total_items: this.getTotalItemsCount()
    };

    console.log('Saving invoice payload:', payload);

    const saveBtn = document.querySelector('.save-btn-bottom') as HTMLButtonElement;
    if (saveBtn) {
      saveBtn.innerText = 'Saving...';
      saveBtn.disabled = true;
    }

    this.http.post(this.saveApiUrl, payload).subscribe({
      next: (response: any) => {
        if (saveBtn) {
          saveBtn.innerText = 'Save Invoice';
          saveBtn.disabled = false;
        }
        if (response.status === true || response.success) {
          alert('Invoice Created Successfully!\nBill No: ' + (response.bill_no || payload.bill_no));
          this.resetForm();
          setTimeout(() => this.router.navigate(['/sales/invoice']), 500);
        } else {
          alert('Error: ' + (response.message || 'Failed to create invoice'));
        }
      },
      error: (err) => {
        if (saveBtn) {
          saveBtn.innerText = 'Save Invoice';
          saveBtn.disabled = false;
        }
        console.error('Save Error:', err);
        alert('Error: ' + (err.message || 'Connection failed'));
      }
    });
  }

  resetForm() {
    this.billItems = [];
    this.selectedCustomer = null;
    this.searchText = '';
    this.additionalCharges = 0;
    this.roundOff = false;
    this.paymentMethod = 'Cash';
    this.paidAmount = 0;
    this.isFullPaymentChecked = false;
    this.selectedCategory = '';
    this.selectedProduct = null;
    this.productSearchText = '';
    this.selectedQty = 1;
    this.discountPercent = 0;
    this.referenceNumber = '';
    this.cgstRate = 0;
    this.sgstRate = 0;
    this.igstRate = 0;
    this.isInterState = false;
    this.setDefaultDates();
  }
}