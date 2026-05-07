import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-create-credit-note',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule
  ],
  templateUrl: './create-credit-note.component.html',
  styleUrls: ['./create-credit-note.component.scss']
})
export class CreateCreditNoteComponent implements OnInit {

  // Vendor/Customer
  vendors: any[] = [];
  filteredVendors: any[] = [];
  searchText: string = '';
  selectedVendor: any = null;
  showDropdown: boolean = false;

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
  payableAmount: number = 0;
  isPayableReadonly: boolean = true;

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

  // Dates
  creditNoteDate: string = '';
  dueDate: string = '';

  // Current Item Details
  currentItem = {
    product: null as any,
    quantity: 1,
    unitPrice: 0,
    discountPercent: 0,
    discountAmount: 0,
    totalAmount: 0
  };

  // API URLs
  vendorApiUrl = 'https://billsezy.com/Api/get_vendor.php';
  categoryApiUrl = 'https://billsezy.com/Api/get_category.php';
  productApiUrl = 'https://billsezy.com/Api/get_product.php';
  saveApiUrl = 'https://billsezy.com/Api/credit-notes.php';

  constructor(
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.getVendors();
    this.getCategories();
    this.getProducts();
    this.setDefaultDates();
  }

  setDefaultDates() {
    this.creditNoteDate = new Date().toISOString().split('T')[0];
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
      this.isPayableReadonly = true;
      this.payableAmount = this.getFinalTotalWithRoundOff();
    } else {
      this.isPayableReadonly = false;
      this.payableAmount = 0;
    }
  }

  onPayableAmountChange() {
    if (this.paymentOption === 'custom') {
      const totalAmount = this.getFinalTotalWithRoundOff();
      if (this.payableAmount > totalAmount) {
        this.payableAmount = totalAmount;
        alert('Receivable amount cannot exceed total amount!');
      }
      if (this.payableAmount < 0) {
        this.payableAmount = 0;
      }
      this.payableAmount = Math.round(this.payableAmount * 100) / 100;
    }
  }

  updatePayableAmount() {
    if (this.paymentOption === 'full') {
      this.payableAmount = this.getFinalTotalWithRoundOff();
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

  // ================= VENDORS =================
  getVendors() {
    this.http.get<any>(this.vendorApiUrl).subscribe({
      next: (response) => {
        if (response.status) {
          this.vendors = response.data;
          this.filteredVendors = response.data;
          console.log("Customers loaded:", this.vendors);
        }
      },
      error: (err) => {
        console.error('Error fetching customers:', err);
        this.vendors = [
          { id: 1, name: 'Rajesh Kumar', company_name: 'Rajesh Enterprises', gstin: '27AAACA1234E1ZR' },
          { id: 2, name: 'Amit Sharma', company_name: 'Sharma Suppliers', gstin: '29ABCDE1234F1ZH' },
          { id: 3, name: 'Priya Mehta', company_name: 'TechGrid Solutions', gstin: '24XYZAB5678C1DX' }
        ];
        this.filteredVendors = [...this.vendors];
      }
    });
  }

  openDropdown() {
    this.showDropdown = true;
    this.filteredVendors = this.vendors;
  }

  searchVendor() {
    const searchValue = this.searchText.toLowerCase();
    this.filteredVendors = this.vendors.filter(vendor =>
      vendor.name?.toLowerCase().includes(searchValue) ||
      vendor.company_name?.toLowerCase().includes(searchValue) ||
      vendor.gstin?.toLowerCase().includes(searchValue)
    );
    this.showDropdown = true;
  }

  selectVendor(vendor: any) {
    this.selectedVendor = vendor;
    this.searchText = vendor.company_name;
    this.showDropdown = false;
  }

  clearVendor() {
    this.selectedVendor = null;
    this.searchText = '';
    this.filteredVendors = this.vendors;
  }

  // ================= CATEGORIES =================
  getCategories() {
    this.http.get<any>(this.categoryApiUrl).subscribe({
      next: (response) => {
        if (response.status) {
          this.categories = response.data;
          console.log("Categories:", this.categories);
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
          this.filteredProducts = response.data;
          console.log("Products:", this.products);
        }
      },
      error: (err) => {
        console.error('Error fetching products:', err);
        this.products = [
          { id: 1, name: 'Wireless Mouse', category: 'Electronics', sell: 599, purchase: 450, hsn: '847160', unit: 'Pcs', tax_type: 'GST 18%' },
          { id: 2, name: 'Mechanical Keyboard', category: 'Electronics', sell: 2499, purchase: 1800, hsn: '847160', unit: 'Pcs', tax_type: 'GST 18%' },
          { id: 3, name: 'Office Chair', category: 'Furniture', sell: 5999, purchase: 4200, hsn: '940139', unit: 'Nos', tax_type: 'GST 12%' },
          { id: 4, name: 'Notebook', category: 'Stationery', sell: 49, purchase: 35, hsn: '482010', unit: 'Pcs', tax_type: 'GST 5%' }
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
    this.currentItem.unitPrice = product.sell || product.purchase || 0;
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

  // ================= ADD TO BILL =================
  addToBill() {
    const productToAdd = this.currentItem.product || this.selectedProduct;
    if (!productToAdd) {
      alert('Please select a product first!');
      return;
    }

    const quantity = this.selectedQty > 0 ? this.selectedQty : 1;
    const discount = this.discountPercent;
    const unitPrice = productToAdd.sell || productToAdd.purchase || 0;
    const subtotal = unitPrice * quantity;
    const discountAmount = (subtotal * discount) / 100;
    const totalAmount = this.roundToTwoDecimals(subtotal - discountAmount);

    const billItem = {
      id: Date.now(),
      productId: productToAdd.id,
      productName: productToAdd.name,
      hsnCode: productToAdd.hsn || 'N/A',
      quantity: quantity,
      unitPrice: unitPrice,
      discount: discount,
      originalDiscount: discount,
      discountAmount: this.roundToTwoDecimals(discountAmount),
      totalAmount: totalAmount,
      category: productToAdd.category,
      unit: productToAdd.unit,
      tax_type: productToAdd.tax_type
    };

    this.billItems.push(billItem);
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
    }
    this.refreshCalculations();
  }

  // ================= CALCULATIONS =================
  getSubTotal(): number {
    const total = this.billItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    return this.roundToTwoDecimals(total);
  }

  getGrandTotal(): number {
    const total = this.billItems.reduce((sum, item) => sum + item.totalAmount, 0);
    return this.roundToTwoDecimals(total);
  }

  getTotalItemDiscount(): number {
    const total = this.billItems.reduce((sum, item) => sum + item.discountAmount, 0);
    return this.roundToTwoDecimals(total);
  }

  getTotalAfterAdditionalCharges(): number {
    const subtotal = this.getSubTotal();
    const totalDiscount = this.getTotalItemDiscount();
    const total = subtotal - totalDiscount + this.additionalCharges;
    return this.roundToTwoDecimals(total);
  }

  calculateRoundOff(): number {
    const total = this.getTotalAfterAdditionalCharges();
    const roundedTotal = Math.round(total);
    this.roundOffValue = this.roundToTwoDecimals(roundedTotal - total);
    return this.roundOffValue;
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
    this.updatePayableAmount();
  }

  updateQuantity(item: any, newQuantity: number) {
    if (newQuantity < 1) return;
    item.quantity = newQuantity;
    this.recalculateItemTotal(item);
    this.globalDiscountPercent = 0;
    this.refreshCalculations();
  }

  recalculateItemTotal(item: any) {
    const subtotal = item.unitPrice * item.quantity;
    let discountPercent = item.discount;
    if (isNaN(discountPercent) || discountPercent === null || discountPercent === '') {
      discountPercent = 0;
      item.discount = 0;
    }
    item.discountAmount = this.roundToTwoDecimals((subtotal * discountPercent) / 100);
    item.totalAmount = this.roundToTwoDecimals(subtotal - item.discountAmount);
  }

  onDiscountPercentChange(item: any) {
    let discountValue = parseFloat(item.discount);
    if (isNaN(discountValue) || discountValue < 0) discountValue = 0;
    if (discountValue > 100) discountValue = 100;
    item.discount = discountValue;
    this.recalculateItemTotal(item);
    this.globalDiscountPercent = 0;
    this.refreshCalculations();
  }

  onDiscountInput(event: any, item: any) {
    let value = event.target.value.replace(/[^0-9.]/g, '');
    let discountValue = parseFloat(value);
    if (isNaN(discountValue)) discountValue = 0;
    if (discountValue < 0) discountValue = 0;
    if (discountValue > 100) discountValue = 100;
    item.discount = discountValue;
    this.recalculateItemTotal(item);
    this.globalDiscountPercent = 0;
    this.refreshCalculations();
  }

  getTotalItemsCount(): number {
    return this.billItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  clearAllItems() {
    if (this.billItems.length > 0 && confirm('Are you sure you want to clear all items?')) {
      this.billItems = [];
      this.globalDiscountPercent = 0;
      this.globalDiscountAmount = 0;
      this.additionalCharges = 0;
      this.roundOff = false;
      this.refreshCalculations();
    }
  }

  // ================= NAVIGATION =================
  goBack() {
    this.router.navigate(['/purchase/credit-notes']);
  }

  cancel() {
    if (this.billItems.length > 0 || this.selectedVendor) {
      if (confirm('Are you sure you want to cancel? All unsaved data will be lost.')) {
        this.router.navigate(['/purchase/credit-notes']);
      }
    } else {
      this.router.navigate(['/purchase/credit-notes']);
    }
  }

  // ================= SAVE TO DATABASE =================
  save() {
    if (this.billItems.length === 0) {
      alert('Please add at least one product!');
      return;
    }

    if (!this.selectedVendor) {
      alert('Please select a customer!');
      return;
    }

    if (this.paymentOption === 'full') {
      this.payableAmount = this.getFinalTotalWithRoundOff();
    }

    const payload = {
      bill_no: 'CN-' + Date.now(),
      date: this.creditNoteDate,
      customer_id: this.selectedVendor?.id,
      customer_name: this.selectedVendor?.company_name,
      customer_gstin: this.selectedVendor?.gstin,
      credit_note_date: this.creditNoteDate,
      due_date: this.dueDate,
      bill_items: this.billItems.map((item: any) => ({
        product_id: item.productId,
        product_name: item.productName,
        hsn_code: item.hsnCode,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount_percent: item.discount,
        discount_amount: item.discountAmount,
        total_amount: item.totalAmount,
        category: item.category,
        unit: item.unit,
        tax_type: item.tax_type
      })),
      sub_total: this.getSubTotal(),
      discount_total: this.getTotalItemDiscount(),
      additional_charges: this.additionalCharges,
      total_after_charges: this.getTotalAfterAdditionalCharges(),
      round_off_enabled: this.roundOff,
      round_off_value: this.calculateRoundOff(),
      grand_total: this.getFinalTotalWithRoundOff(),
      payment_option: this.paymentOption,
      receivable_amount: this.payableAmount,
      total_items: this.getTotalItemsCount()
    };

    console.log("Sending Payload:", payload);

    const saveBtn = document.querySelector('.save-btn') as HTMLButtonElement;
    const payableSaveBtn = document.querySelector('.payable-save-btn') as HTMLButtonElement;
    
    if (saveBtn) {
      saveBtn.innerText = 'Saving...';
      saveBtn.disabled = true;
    }
    if (payableSaveBtn) {
      payableSaveBtn.innerText = 'Saving...';
      payableSaveBtn.disabled = true;
    }

    this.http.post(this.saveApiUrl, payload).subscribe({
      next: (response: any) => {
        if (saveBtn) {
          saveBtn.innerText = 'Save';
          saveBtn.disabled = false;
        }
        if (payableSaveBtn) {
          payableSaveBtn.innerText = 'Save';
          payableSaveBtn.disabled = false;
        }

        const isSuccess = response.status === 'success' || 
                          response.status === true || 
                          response.status === 1 ||
                          response.success === true ||
                          response.success === 1;
        
        if (isSuccess) {
          alert('Credit Note Created Successfully!\nBill No: ' + (response.bill_no || payload.bill_no));
          this.resetForm();
          
          setTimeout(() => {
            this.router.navigate(['/purchase/credit-notes']).then((success) => {
              if (!success) {
                window.location.href = '/purchase/credit-notes';
              }
            }).catch(err => {
              window.location.href = '/purchase/credit-notes';
            });
          }, 500);
        } else {
          alert('Error: ' + (response.message || 'Failed to create credit note'));
        }
      },
      error: (err) => {
        console.error('API Error:', err);
        if (saveBtn) {
          saveBtn.innerText = 'Save';
          saveBtn.disabled = false;
        }
        if (payableSaveBtn) {
          payableSaveBtn.innerText = 'Save';
          payableSaveBtn.disabled = false;
        }
        alert('Error: ' + (err.message || 'Connection failed'));
      }
    });
  }

  resetForm() {
    this.billItems = [];
    this.selectedVendor = null;
    this.searchText = '';
    this.additionalCharges = 0;
    this.roundOff = false;
    this.paymentOption = 'full';
    this.payableAmount = 0;
    this.isPayableReadonly = true;
    this.selectedCategory = '';
    this.selectedProduct = null;
    this.productSearchText = '';
    this.selectedQty = 1;
    this.discountPercent = 0;
    this.globalDiscountPercent = 0;
    this.setDefaultDates();
  }
}