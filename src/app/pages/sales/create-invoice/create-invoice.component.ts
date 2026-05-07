import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CustomerFormComponent } from '../../../components/customer-form/customer-form.component';

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
  paymentOption: string = 'full';
  paidAmount: number = 0;
  isPaidReadonly: boolean = true;

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
  // Add these properties in your component class
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

  // API URL for updating customer address
  updateCustomerApiUrl = 'https://billsezy.com/Api/update_customer_address.php';
  // API URLs
  customerApiUrl = 'https://billsezy.com/Api/get_customers.php';
  categoryApiUrl = 'https://billsezy.com/Api/get_category.php';
  productApiUrl = 'https://billsezy.com/Api/get_product.php';
  saveApiUrl = 'https://billsezy.com/Api/add-invoice.php';
  companyApiUrl = 'https://billsezy.com/Api/get_company_details.php';

  constructor(
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.getCompanyDetails();
    this.getCustomers();
    this.getCategories();
    this.getProducts();
    this.setDefaultDates();
  }

  // ================= GET COMPANY DETAILS =================
  getCompanyDetails() {
    const userId = localStorage.getItem('user_id') || '1';

    this.http.get<any>(`${this.companyApiUrl}?user_id=${userId}`).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.companyDetails = response.data;
          this.companyState = response.data.state || '';
          this.companyName = response.data.company_name || response.data.trade_name || '';
          this.companyGSTIN = response.data.gstin || '';

          localStorage.setItem('companyDetails', JSON.stringify(this.companyDetails));
          localStorage.setItem('companyState', this.companyState);
          localStorage.setItem('companyName', this.companyName);
        } else {
          const savedState = localStorage.getItem('companyState');
          if (savedState) {
            this.companyState = savedState;
          }
        }
      },
      error: (err) => {
        console.error('Error fetching company details:', err);
        const savedState = localStorage.getItem('companyState');
        if (savedState) {
          this.companyState = savedState;
        }
      }
    });
  }
  selectCustomer(customer: any) {
    this.selectedCustomer = customer;
    this.searchText = customer.company_name || customer.name;
    this.showDropdown = false;

    // If delivery address is empty, initialize with billing address
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
      this.calculateTaxRates();
      return;
    }

    const customerState = this.selectedCustomer.state || this.selectedCustomer.delivery_state || '';
    const companyState = this.companyState || '';

    if (companyState && customerState) {
      const normalizedCompanyState = companyState.trim().toLowerCase();
      const normalizedCustomerState = customerState.trim().toLowerCase();
      this.isInterState = normalizedCompanyState !== normalizedCustomerState;
    } else {
      this.isInterState = false;
    }

    this.calculateTaxRates();
  }

  // Calculate tax rates based on products and state type
  calculateTaxRates() {
    // Get the tax rate from first product or selected product
    let taxRate = 0;

    if (this.billItems.length > 0) {
      // Get tax rate from first product in bill
      taxRate = this.billItems[0].gstRate || this.billItems[0].tax_rate || 0;
    } else if (this.selectedProduct) {
      taxRate = this.extractTaxRateFromProduct(this.selectedProduct);
    } else {
      // Default tax rate if no products
      taxRate = 18;
    }

    if (this.isInterState) {
      // Inter-state: Only IGST
      this.igstRate = taxRate;
      this.cgstRate = 0;
      this.sgstRate = 0;
    } else {
      // Intra-state: CGST + SGST (split equally)
      this.cgstRate = taxRate / 2;
      this.sgstRate = taxRate / 2;
      this.igstRate = 0;
    }

    console.log('Tax Rates Calculated:', {
      isInterState: this.isInterState,
      taxRate: taxRate,
      cgstRate: this.cgstRate,
      sgstRate: this.sgstRate,
      igstRate: this.igstRate,
      taxableAmount: this.getTaxableAmount()
    });
  }

  updateTaxRatesForProduct(product: any) {
    const taxRate = this.extractTaxRateFromProduct(product);

    if (this.isInterState) {
      this.igstRate = taxRate;
      this.cgstRate = 0;
      this.sgstRate = 0;
    } else {
      this.cgstRate = taxRate / 2;
      this.sgstRate = taxRate / 2;
      this.igstRate = 0;
    }

    // Update all existing bill items with new GST calculation
    this.updateAllBillItemsGST();
    this.refreshCalculations();
  }

  // Update all bill items GST amounts
  updateAllBillItemsGST() {
    for (let item of this.billItems) {
      const taxRate = item.gstRate || item.tax_rate || 0;
      item.gstAmount = this.roundToTwoDecimals((item.taxableValue * taxRate) / 100);
    }
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

  onPaymentOptionChange(option: string) {
    this.paymentOption = option;
    if (option === 'full') {
      this.isPaidReadonly = true;
      this.paidAmount = this.getFinalTotalWithRoundOff();
    } else {
      this.isPaidReadonly = false;
      this.paidAmount = 0;
    }
    this.refreshCalculations();
  }

  onPaidAmountChange() {
    if (this.paymentOption === 'custom') {
      const totalAmount = this.getFinalTotalWithRoundOff();
      if (this.paidAmount > totalAmount) {
        this.paidAmount = totalAmount;
      }
      if (this.paidAmount < 0) {
        this.paidAmount = 0;
      }
      this.paidAmount = Math.round(this.paidAmount * 100) / 100;
      this.refreshCalculations();
    }
  }

  updatePaidAmount() {
    if (this.paymentOption === 'full') {
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

  // ================= CUSTOMERS =================
  getCustomers() {
    this.http.get<any>(this.customerApiUrl).subscribe({
      next: (response) => {
        if (response.status) {
          this.customers = response.data;
          this.filteredCustomers = [...response.data];
        }
      },
      error: (err) => {
        console.error('Error fetching customers:', err);
        this.customers = [
          { id: 1, name: 'Rajesh Kumar', company_name: 'Rajesh Enterprises', gstin: '27AAACA1234E1ZR', state: 'Maharashtra' },
          { id: 2, name: 'Amit Sharma', company_name: 'Sharma Suppliers', gstin: '29ABCDE1234F1ZH', state: 'Gujarat' },
          { id: 3, name: 'Priya Mehta', company_name: 'TechGrid Solutions', gstin: '24XYZAB5678C1DX', state: 'Maharashtra' }
        ];
        this.filteredCustomers = [...this.customers];
      }
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
        c.name === customer.name ||
        c.company_name === customer.company_name ||
        c.id === customer.id
      );
      if (foundCustomer) {
        this.selectCustomer(foundCustomer);
      }
    }, 500);
    this.closeCustomerForm();
  }

  // ================= CATEGORIES =================
  getCategories() {
    this.http.get<any>(this.categoryApiUrl).subscribe({
      next: (response) => {
        if (response.status) {
          this.categories = response.data;
        }
      },
      error: (err) => {
        console.error('Error fetching categories:', err);
        this.categories = [
          { id: 1, name: 'Electronics' },
          { id: 2, name: 'Furniture' },
          { id: 3, name: 'Stationery' }
        ];
      }
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

  // ================= PRODUCTS =================
  getProducts() {
    this.http.get<any>(this.productApiUrl).subscribe({
      next: (response) => {
        if (response.status) {
          this.products = response.data;
          this.filteredProducts = [...response.data];
        }
      },
      error: (err) => {
        console.error('Error fetching products:', err);
        this.products = [
          { id: 1, name: 'Wireless Mouse', category: 'Electronics', sell: 599, purchase: 450, hsn: '847160', unit: 'Pcs', gst_rate: 18 },
          { id: 2, name: 'Mechanical Keyboard', category: 'Electronics', sell: 2499, purchase: 1800, hsn: '847160', unit: 'Pcs', gst_rate: 18 },
          { id: 3, name: 'Office Chair', category: 'Furniture', sell: 5999, purchase: 4200, hsn: '940139', unit: 'Nos', gst_rate: 12 },
          { id: 4, name: 'Notebook', category: 'Stationery', sell: 49, purchase: 35, hsn: '482010', unit: 'Pcs', gst_rate: 5 }
        ];
        this.filteredProducts = [...this.products];
      }
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
    this.updateTaxRatesForProduct(product);
  }

  clearProduct() {
    this.selectedProduct = null;
    this.productSearchText = '';
    this.showProductDropdown = false;
    this.resetCurrentItem();
    this.selectedQty = 0;
    this.discountPercent = 0;
    this.filterProductsByCategory();
  }
  // Update unit price for existing bill item
  updateItemUnitPrice(item: any, newPrice: number) {
    if (isNaN(newPrice)) newPrice = 0;
    if (newPrice < 0) newPrice = 0;
    item.unitPrice = newPrice;
    this.recalculateItemTotal(item);
    this.calculateTaxRates();
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
    const taxType = product.tax_type || '';
    const match = taxType.match(/(\d+(?:\.\d+)?)/);
    if (match) {
      return parseFloat(match[1]);
    }
    return 18; // Default 18% if not found
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
    const discountType = 'percentage';
    const unitPrice = productToAdd.sell || 0;
    const subtotal = unitPrice * quantity;

    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = (subtotal * discountValue) / 100;
    } else {
      discountAmount = discountValue;
    }

    const taxableValue = this.roundToTwoDecimals(subtotal - discountAmount);
    const gstAmount = this.roundToTwoDecimals((taxableValue * taxRate) / 100);

    const billItem = {
      id: Date.now(),
      productId: productToAdd.id,
      productName: productToAdd.name,
      hsnCode: productToAdd.hsn || 'N/A',
      quantity: quantity,
      unitPrice: unitPrice,
      discountValue: discountValue,
      discountType: discountType,
      discountAmount: this.roundToTwoDecimals(discountAmount),
      taxableValue: taxableValue,
      totalAmount: taxableValue,
      gstRate: taxRate,
      gstAmount: gstAmount,
      category: productToAdd.category,
      unit: productToAdd.unit
    };

    this.billItems.push(billItem);

    // Recalculate tax rates based on products
    this.calculateTaxRates();

    this.clearProduct();
    this.selectedQty = 1;
    this.discountPercent = 0;
    this.resetCurrentItem();
    this.globalDiscountPercent = 0;

    this.refreshCalculations();
  }

  removeItem(itemId: number) {
    this.billItems = this.billItems.filter(item => item.id !== itemId);
    if (this.billItems.length === 0) {
      this.globalDiscountPercent = 0;
      this.cgstRate = 0;
      this.sgstRate = 0;
      this.igstRate = 0;
    } else {
      this.calculateTaxRates();
    }
    this.refreshCalculations();
  }

  // ================= DISCOUNT HANDLERS =================
  onDiscountValueChange(item: any) {
    let discountValue = parseFloat(item.discountValue);
    if (isNaN(discountValue)) discountValue = 0;
    if (discountValue < 0) discountValue = 0;
    if (item.discountType === 'percentage' && discountValue > 100) {
      discountValue = 100;
    }
    item.discountValue = discountValue;
    this.recalculateItemTotal(item);
    this.calculateTaxRates();
    this.refreshCalculations();
  }

  onDiscountTypeChange(item: any) {
    if (item.discountType === 'percentage') {
      if (item.discountValue > 100) item.discountValue = 100;
    }
    this.recalculateItemTotal(item);
    this.calculateTaxRates();
    this.refreshCalculations();
  }

  // ================= CALCULATIONS =================
  getSubTotal(): number {
    const total = this.billItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    return this.roundToTwoDecimals(total);
  }

  getTotalItemDiscount(): number {
    const total = this.billItems.reduce((sum, item) => sum + item.discountAmount, 0);
    return this.roundToTwoDecimals(total);
  }

  getTaxableAmount(): number {
    return this.roundToTwoDecimals(this.getSubTotal() - this.getTotalItemDiscount());
  }

  getCGSTAmount(): number {
    if (!this.isInterState && this.cgstRate > 0) {
      return this.roundToTwoDecimals((this.getTaxableAmount() * this.cgstRate) / 100);
    }
    return 0;
  }

  getSGSTAmount(): number {
    if (!this.isInterState && this.sgstRate > 0) {
      return this.roundToTwoDecimals((this.getTaxableAmount() * this.sgstRate) / 100);
    }
    return 0;
  }

  getIGSTAmount(): number {
    if (this.isInterState && this.igstRate > 0) {
      return this.roundToTwoDecimals((this.getTaxableAmount() * this.igstRate) / 100);
    }
    return 0;
  }
  // Get Total Amount (Subtotal + Total Tax)
  getTotalAmount(): number {
    const total = this.getSubTotal() + this.getTotalTaxAmount();
    return this.roundToTwoDecimals(total);
  }
  getTotalTaxAmount(): number {
    return this.getCGSTAmount() + this.getSGSTAmount() + this.getIGSTAmount();
  }

  getTotalAfterAdditionalCharges(): number {
    const total = this.getTaxableAmount() + this.getTotalTaxAmount() + this.additionalCharges;
    return this.roundToTwoDecimals(total);
  }

  calculateRoundOff(): number {
    const total = this.getTotalAfterAdditionalCharges();
    const roundedTotal = Math.round(total);
    this.roundOffValue = this.roundToTwoDecimals(roundedTotal - total);
    return this.roundOffValue;
  }
  // Get CGST for a specific item (based on item's OWN GST rate)
  getItemCGST(item: any): number {
    if (!this.isInterState && item.gstRate > 0) {
      // Use item's own gstRate, split into CGST
      const cgstRateForItem = item.gstRate / 2;
      return this.roundToTwoDecimals((item.taxableValue * cgstRateForItem) / 100);
    }
    return 0;
  }
  // Get Total CGST Amount (sum of all items' CGST)
  getTotalCGSTAmount(): number {
    if (!this.isInterState) {
      return this.billItems.reduce((sum, item) => sum + this.getItemCGST(item), 0);
    }
    return 0;
  }

  // Get Total SGST Amount (sum of all items' SGST)
  getTotalSGSTAmount(): number {
    if (!this.isInterState) {
      return this.billItems.reduce((sum, item) => sum + this.getItemSGST(item), 0);
    }
    return 0;
  }

  // Get Total IGST Amount (sum of all items' IGST)
  getTotalIGSTAmount(): number {
    if (this.isInterState) {
      return this.billItems.reduce((sum, item) => sum + this.getItemIGST(item), 0);
    }
    return 0;
  }
  // Get SGST for a specific item (based on item's own taxable value)
  getItemSGST(item: any): number {
    if (!this.isInterState && this.sgstRate > 0) {
      // Use item's own taxableValue, not global total
      return this.roundToTwoDecimals((item.taxableValue * this.sgstRate) / 100);
    }
    return 0;
  }
  // Get IGST for a specific item (based on item's own taxable value)
  getItemIGST(item: any): number {
    if (this.isInterState && this.igstRate > 0) {
      // Use item's own taxableValue, not global total
      return this.roundToTwoDecimals((item.taxableValue * this.igstRate) / 100);
    }
    return 0;
  }
  // Get Total with Tax for a specific item
  getItemTotalWithTax(item: any): number {
    const taxAmount = this.getItemCGST(item) + this.getItemSGST(item) + this.getItemIGST(item);
    return this.roundToTwoDecimals(item.taxableValue + taxAmount);
  }

  // Get Total Taxable Amount (sum of all items)
  getTotalTaxableAmount(): number {
    return this.billItems.reduce((sum, item) => sum + item.taxableValue, 0);
  }
  getFinalTotalWithRoundOff(): number {
    let total = this.getTotalAfterAdditionalCharges();
    if (this.roundOff) {
      total = Math.round(total);
    }
    return this.roundToTwoDecimals(total);
  }

  onAdditionalChargesChange() {
    if (this.additionalCharges < 0) {
      this.additionalCharges = 0;
    }
    this.additionalCharges = this.roundToTwoDecimals(this.additionalCharges);
    this.refreshCalculations();
  }

  onRoundOffToggle(event: any) {
    this.roundOff = event.target.checked;
    this.refreshCalculations();
  }

  refreshCalculations() {
    this.calculateRoundOff();
    this.updatePaidAmount();
  }

  updateQuantity(item: any, newQuantity: number) {
    if (newQuantity < 1) return;
    item.quantity = newQuantity;
    this.recalculateItemTotal(item);
    this.calculateTaxRates();
    this.refreshCalculations();
  }

  recalculateItemTotal(item: any) {
    const subtotal = item.unitPrice * item.quantity;
    let discountAmount = 0;

    if (item.discountType === 'percentage') {
      discountAmount = (subtotal * item.discountValue) / 100;
    } else {
      discountAmount = item.discountValue;
      if (discountAmount > subtotal) {
        discountAmount = subtotal;
        item.discountValue = discountAmount;
      }
    }

    item.discountAmount = this.roundToTwoDecimals(discountAmount);
    item.taxableValue = this.roundToTwoDecimals(subtotal - discountAmount);
    const taxRate = item.gstRate || 0;
    item.gstAmount = this.roundToTwoDecimals((item.taxableValue * taxRate) / 100);
  }
  // Get formatted billing address
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

  // Get formatted delivery address (always shows delivery address, not billing)
  getDeliveryAddress(): string {
    if (!this.selectedCustomer) return '';

    const parts = [];
    if (this.selectedCustomer.delivery_address_line1) parts.push(this.selectedCustomer.delivery_address_line1);
    if (this.selectedCustomer.delivery_address_line2) parts.push(this.selectedCustomer.delivery_address_line2);
    if (this.selectedCustomer.delivery_city) parts.push(this.selectedCustomer.delivery_city);
    if (this.selectedCustomer.delivery_state) parts.push(this.selectedCustomer.delivery_state);
    if (this.selectedCustomer.delivery_pincode) parts.push(this.selectedCustomer.delivery_pincode);

    if (parts.length === 0) {
      // If no delivery address exists, show default message
      return 'No delivery address added. Click edit to add.';
    }

    return parts.join(', ');
  }

  // Get short address for display (single line)
  getShortBillingAddress(): string {
    if (!this.selectedCustomer) return '';

    const parts = [];
    if (this.selectedCustomer.address_line1) parts.push(this.selectedCustomer.address_line1);
    if (this.selectedCustomer.city) parts.push(this.selectedCustomer.city);
    if (this.selectedCustomer.pincode) parts.push(this.selectedCustomer.pincode);

    return parts.join(', ') || 'Address not available';
  }

  // Get short delivery address for display (single line)
  getShortDeliveryAddress(): string {
    if (!this.selectedCustomer) return '';

    if (this.selectedCustomer.same_as_billing === '1' || this.selectedCustomer.same_as_billing === 1) {
      return this.getShortBillingAddress();
    }

    const parts = [];
    if (this.selectedCustomer.delivery_address_line1) parts.push(this.selectedCustomer.delivery_address_line1);
    if (this.selectedCustomer.delivery_city) parts.push(this.selectedCustomer.delivery_city);
    if (this.selectedCustomer.delivery_pincode) parts.push(this.selectedCustomer.delivery_pincode);

    return parts.join(', ') || this.getShortBillingAddress();
  }
  getTotalItemsCount(): number {
    return this.billItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  // ================= NAVIGATION =================
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
  // Toggle edit mode for delivery address
  toggleEditDeliveryAddress() {
    if (!this.selectedCustomer) return;

    // Load current delivery address into edit form
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

  // Cancel edit mode
  cancelEditDeliveryAddress() {
    this.isEditingDeliveryAddress = false;
    this.editDeliveryAddress = {
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      pincode: '',
      country: ''
    };
  }

  // Save delivery address to database
  saveDeliveryAddress() {
    if (!this.selectedCustomer) return;

    this.isSaving = true;

    const payload = {
      customer_id: this.selectedCustomer.id,
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

        if (response.status === 'success' || response.success) {
          // Update local customer object
          this.selectedCustomer.delivery_address_line1 = this.editDeliveryAddress.address_line1;
          this.selectedCustomer.delivery_address_line2 = this.editDeliveryAddress.address_line2;
          this.selectedCustomer.delivery_city = this.editDeliveryAddress.city;
          this.selectedCustomer.delivery_state = this.editDeliveryAddress.state;
          this.selectedCustomer.delivery_pincode = this.editDeliveryAddress.pincode;
          this.selectedCustomer.delivery_country = this.editDeliveryAddress.country;

          // Also update in customers array
          const index = this.customers.findIndex(c => c.id === this.selectedCustomer.id);
          if (index !== -1) {
            this.customers[index] = { ...this.selectedCustomer };
            this.filteredCustomers = [...this.customers];
          }

          alert('Delivery address updated successfully!');
          this.isEditingDeliveryAddress = false;
          this.refreshCalculations();
        } else {
          alert('Error: ' + (response.message || 'Failed to update address'));
        }
      },
      error: (err) => {
        this.isSaving = false;
        console.error('API Error:', err);
        alert('Error: ' + (err.message || 'Connection failed'));
      }
    });
  }
  // ================= SAVE TO DATABASE =================
  save() {
    if (this.billItems.length === 0) {
      alert('Please add at least one product!');
      return;
    }

    if (!this.selectedCustomer) {
      alert('Please select a customer!');
      return;
    }

    if (this.paymentOption === 'full') {
      this.paidAmount = this.getFinalTotalWithRoundOff();
    }

    const remainingAmount = this.getFinalTotalWithRoundOff() - this.paidAmount;
    const invoiceStatus = remainingAmount === 0 ? 'Paid' : (this.paidAmount > 0 ? 'Partially Paid' : 'Unpaid');

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
      gst_amount: item.gstAmount,
      category: item.category,
      unit: item.unit
    }));

    const payload = {
      bill_no: 'INV-' + Date.now(),
      invoice_date: this.invoiceDate,
      due_date: this.dueDate,
      reference_number: this.referenceNumber,
      customer_id: this.selectedCustomer?.id,
      customer_name: this.selectedCustomer?.company_name || this.selectedCustomer?.name,
      customer_gstin: this.selectedCustomer?.gstin,
      customer_phone: this.selectedCustomer?.phone,
      customer_email: this.selectedCustomer?.email,
      customer_address: (this.selectedCustomer?.address_line1 || '') + ' ' + (this.selectedCustomer?.address_line2 || ''),
      customer_city: this.selectedCustomer?.city,
      customer_state: this.selectedCustomer?.state,
      customer_pincode: this.selectedCustomer?.pincode,
      company_name: this.companyName,
      company_state: this.companyState,
      company_gstin: this.companyGSTIN,
      is_inter_state: this.isInterState ? 1 : 0,
      cgst_rate: this.cgstRate,
      cgst_amount: this.getCGSTAmount(),
      sgst_rate: this.sgstRate,
      sgst_amount: this.getSGSTAmount(),
      igst_rate: this.igstRate,
      igst_amount: this.getIGSTAmount(),
      total_tax_amount: this.getTotalTaxAmount(),
      sub_total: this.getSubTotal(),
      discount_total: this.getTotalItemDiscount(),
      taxable_amount: this.getTaxableAmount(),
      additional_charges: this.additionalCharges,
      total_after_charges: this.getTotalAfterAdditionalCharges(),
      round_off_enabled: this.roundOff ? 1 : 0,
      round_off_value: this.calculateRoundOff(),
      grand_total: this.getFinalTotalWithRoundOff(),
      payment_option: this.paymentOption,
      paid_amount: this.paidAmount,
      remaining_amount: remainingAmount,
      status: invoiceStatus,
      product_items: JSON.stringify(productItems),
      total_items: this.getTotalItemsCount(),
      bill_items: this.billItems
    };

    const saveBtn = document.querySelector('.save-btn') as HTMLButtonElement;
    if (saveBtn) {
      saveBtn.innerText = 'Saving...';
      saveBtn.disabled = true;
    }

    this.http.post(this.saveApiUrl, payload).subscribe({
      next: (response: any) => {
        if (saveBtn) {
          saveBtn.innerText = 'Save';
          saveBtn.disabled = false;
        }
        if (response.status === 'success' || response.success) {
          alert('Invoice Created Successfully!\nBill No: ' + (response.bill_no || payload.bill_no));
          this.resetForm();
          setTimeout(() => {
            this.router.navigate(['/sales/add-invoice']);
          }, 500);
        } else {
          alert('Error: ' + (response.message || 'Failed to create invoice'));
        }
      },
      error: (err) => {
        console.error('API Error:', err);
        if (saveBtn) {
          saveBtn.innerText = 'Save';
          saveBtn.disabled = false;
        }
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
    this.paymentOption = 'full';
    this.paidAmount = 0;
    this.isPaidReadonly = true;
    this.selectedCategory = '';
    this.selectedProduct = null;
    this.productSearchText = '';
    this.selectedQty = 1;
    this.discountPercent = 0;
    this.globalDiscountPercent = 0;
    this.referenceNumber = '';
    this.cgstRate = 0;
    this.sgstRate = 0;
    this.igstRate = 0;
    this.isInterState = false;
    this.setDefaultDates();
  }
}