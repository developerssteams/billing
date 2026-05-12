import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-create-purchase',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './create-purchase.component.html',
  styleUrls: ['./create-purchase.component.scss'],
})
export class CreatePurchaseComponent implements OnInit {

  // Vendor
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
  paymentMethod: string = 'Cash';
  paidAmount: number = 0;
  isFullPaymentChecked: boolean = false;

  // Discount on product
  discountPercent: number = 0;

  // Bill Items Array
  billItems: any[] = [];

  // Dates
  purchaseDate: string = '';
  paymentDate: string = '';

  // Reference Number
  referenceNumber: string = '';

  // API URLs
  vendorApiUrl = 'https://billsezy.com/Api/get_vendor.php';
  categoryApiUrl = 'https://billsezy.com/Api/get_category.php';
  productApiUrl = 'https://billsezy.com/Api/get_product.php';
  saveApiUrl = 'https://billsezy.com/Api/add-purchase.php';

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
    this.setDefaultDates();
    this.getVendors();
    this.getCategories();
    this.getProducts();
  }

  setDefaultDates() {
    this.purchaseDate = new Date().toISOString().split('T')[0];
    this.paymentDate = new Date().toISOString().split('T')[0];
  }

  // ================= VENDORS =================
  getVendors() {
    this.http.get<any>(`${this.vendorApiUrl}?user_id=${this.userId}`).subscribe({
      next: (response) => {
        if (response.status === true) {
          this.vendors = response.data || [];
          this.filteredVendors = [...this.vendors];
        }
      },
      error: (err) => console.error('Error fetching vendors:', err)
    });
  }

  openDropdown() {
    this.showDropdown = true;
    this.filteredVendors = [...this.vendors];
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
    this.searchText = vendor.company_name || vendor.name;
    this.showDropdown = false;
  }

  clearVendor() {
    this.selectedVendor = null;
    this.searchText = '';
    this.filteredVendors = [...this.vendors];
  }

  getVendorAddress(): string {
    if (!this.selectedVendor) return '';
    const parts = [];
    if (this.selectedVendor.address_line1) parts.push(this.selectedVendor.address_line1);
    if (this.selectedVendor.address_line2) parts.push(this.selectedVendor.address_line2);
    if (this.selectedVendor.city) parts.push(this.selectedVendor.city);
    if (this.selectedVendor.state) parts.push(this.selectedVendor.state);
    if (this.selectedVendor.pincode) parts.push(this.selectedVendor.pincode);
    return parts.join(', ') || 'Address not available';
  }

  // ================= CATEGORIES =================
  getCategories() {
    this.http.get<any>(`${this.categoryApiUrl}?user_id=${this.userId}`).subscribe({
      next: (response) => {
        if (response.status === true) {
          this.categories = response.data || [];
        }
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
    this.selectedQty = 1;
    this.discountPercent = 0;
  }

  // ================= PRODUCTS =================
  getProducts() {
    this.http.get<any>(`${this.productApiUrl}?user_id=${this.userId}`).subscribe({
      next: (response) => {
        if (response.status === true) {
          this.products = response.data || [];
          this.filteredProducts = [...this.products];
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
    this.discountPercent = 0;
  }

  clearProduct() {
    this.selectedProduct = null;
    this.productSearchText = '';
    this.showProductDropdown = false;
    this.selectedQty = 1;
    this.discountPercent = 0;
    this.filterProductsByCategory();
  }

  // ================= ADD TO BILL =================
  addToBill() {
    if (!this.selectedProduct) {
      alert('Please select a product first!');
      return;
    }

    const quantity = this.selectedQty > 0 ? this.selectedQty : 1;
    const discountValue = this.discountPercent;
    const unitPrice = this.selectedProduct.purchase || this.selectedProduct.sell || 0;
    const subtotal = unitPrice * quantity;

    let discountAmount = (subtotal * discountValue) / 100;
    const totalAmount = subtotal - discountAmount;

    const billItem = {
      id: Date.now(),
      productId: this.selectedProduct.id,
      productName: this.selectedProduct.name,
      hsnCode: this.selectedProduct.hsn || 'N/A',
      quantity: quantity,
      unitPrice: unitPrice,
      discountValue: discountValue,
      discountType: 'percentage',
      discountAmount: Math.round(discountAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      category: this.selectedProduct.category,
      unit: this.selectedProduct.unit
    };

    this.billItems.push(billItem);
    this.clearProduct();
    this.selectedQty = 1;
    this.discountPercent = 0;
  }

  removeItem(itemId: number) {
    this.billItems = this.billItems.filter(item => item.id !== itemId);
  }

  updateQuantity(item: any, newQuantity: number) {
    if (newQuantity < 1) return;
    item.quantity = newQuantity;
    this.recalculateItemTotal(item);
  }

  updateItemUnitPrice(item: any, newPrice: number) {
    if (isNaN(newPrice)) newPrice = 0;
    if (newPrice < 0) newPrice = 0;
    item.unitPrice = newPrice;
    this.recalculateItemTotal(item);
  }

  onDiscountValueChange(item: any) {
    let discountValue = parseFloat(item.discountValue);
    if (isNaN(discountValue)) discountValue = 0;
    if (discountValue < 0) discountValue = 0;
    if (item.discountType === 'percentage' && discountValue > 100) discountValue = 100;
    item.discountValue = discountValue;
    this.recalculateItemTotal(item);
  }

  onDiscountTypeChange(item: any) {
    if (item.discountType === 'percentage' && item.discountValue > 100) item.discountValue = 100;
    this.recalculateItemTotal(item);
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

    item.discountAmount = Math.round(discountAmount * 100) / 100;
    item.totalAmount = Math.round((subtotal - discountAmount) * 100) / 100;
  }

  // ================= CALCULATIONS =================
  getSubTotal(): number {
    return this.billItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  }

  getTotalDiscount(): number {
    return this.billItems.reduce((sum, item) => sum + item.discountAmount, 0);
  }

  getTotalAmount(): number {
    return this.billItems.reduce((sum, item) => sum + item.totalAmount, 0);
  }

  getItemTotal(item: any): number {
    return item.totalAmount;
  }

  // ================= PAYMENT =================
  onFullPaymentToggle() {
    if (this.isFullPaymentChecked) {
      this.paidAmount = this.getTotalAmount();
    } else {
      this.paidAmount = 0;
    }
  }

  onPaidAmountChange() {
    const totalAmount = this.getTotalAmount();
    if (this.paidAmount > totalAmount) {
      this.paidAmount = totalAmount;
    }
    if (this.paidAmount < 0) {
      this.paidAmount = 0;
    }
    this.paidAmount = Math.round(this.paidAmount * 100) / 100;

    if (this.paidAmount !== totalAmount) {
      this.isFullPaymentChecked = false;
    } else if (this.paidAmount === totalAmount && this.paidAmount > 0) {
      this.isFullPaymentChecked = true;
    }
  }

  // ================= SAVE =================
  save() {
    if (this.billItems.length === 0) {
      alert('Please add at least one product!');
      return;
    }
    if (!this.selectedVendor) {
      alert('Please select a vendor!');
      return;
    }

    const remainingAmount = this.getTotalAmount() - this.paidAmount;
    const purchaseStatus = remainingAmount === 0 ? 'Paid' : (this.paidAmount > 0 ? 'Partially Paid' : 'Unpaid');

    const productItems = this.billItems.map((item: any) => ({
      id: item.productId,
      name: item.productName,
      hsn: item.hsnCode,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      discount_type: item.discountType,
      discount_value: item.discountValue,
      discount_amount: item.discountAmount,
      total_amount: item.totalAmount,
      category: item.category,
      unit: item.unit
    }));

    const payload = {
      user_id: this.userId,
      bill_no: 'PUR-' + Date.now(),
      invoice_date: this.purchaseDate,
      payment_date: this.paymentDate,
      reference_number: this.referenceNumber || '',
      vendor_id: this.selectedVendor?.id,
      vendor_name: this.selectedVendor?.company_name || this.selectedVendor?.name,
      vendor_gstin: this.selectedVendor?.gstin || '',
      vendor_phone: this.selectedVendor?.phone || '',
      vendor_email: this.selectedVendor?.email || '',
      vendor_address: this.getVendorAddress(),
      vendor_city: this.selectedVendor?.city || '',
      vendor_state: this.selectedVendor?.state || '',
      vendor_pincode: this.selectedVendor?.pincode || '',
      purchase_price: this.getTotalAmount(),
      discount: this.getTotalDiscount(),
      status: purchaseStatus,
      remaining_amount: remainingAmount,
      payable_amount: this.paidAmount,
      product_items: JSON.stringify(productItems),
      total_items: this.billItems.length
    };

    const saveBtn = document.querySelector('.save-btn-bottom') as HTMLButtonElement;
    if (saveBtn) {
      saveBtn.innerText = 'Saving...';
      saveBtn.disabled = true;
    }

    this.http.post(this.saveApiUrl, payload).subscribe({
      next: (response: any) => {
        if (saveBtn) {
          saveBtn.innerText = 'Save Purchase';
          saveBtn.disabled = false;
        }
        if (response.status === true || response.success === true) {
          alert('Purchase Created Successfully!\nBill No: ' + (response.bill_no || payload.bill_no));
          this.resetForm();
          this.router.navigate(['/purchase']);
        } else {
          alert('Error: ' + (response.message || 'Failed to create purchase'));
        }
      },
      error: (err) => {
        if (saveBtn) {
          saveBtn.innerText = 'Save Purchase';
          saveBtn.disabled = false;
        }
        console.error('Save Error:', err);
        alert('Error: ' + (err.message || 'Connection failed'));
      }
    });
  }

  resetForm() {
    this.billItems = [];
    this.selectedVendor = null;
    this.searchText = '';
    this.paymentMethod = 'Cash';
    this.paidAmount = 0;
    this.isFullPaymentChecked = false;
    this.selectedCategory = '';
    this.selectedProduct = null;
    this.productSearchText = '';
    this.selectedQty = 1;
    this.discountPercent = 0;
    this.referenceNumber = '';
    this.setDefaultDates();
  }

  goBack() {
    this.router.navigate(['/purchase']);
  }

  cancel() {
    if (this.billItems.length > 0 || this.selectedVendor) {
      if (confirm('Are you sure you want to cancel? All unsaved data will be lost.')) {
        this.router.navigate(['/purchase']);
      }
    } else {
      this.router.navigate(['/purchase']);
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
}