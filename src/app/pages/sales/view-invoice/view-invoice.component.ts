import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-view-invoice',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './view-invoice.component.html',
  styleUrls: ['./view-invoice.component.scss'],
})
export class ViewInvoiceComponent implements OnInit {

  invoiceData: any = null;
  invoiceId: number = 0;
  isLoading: boolean = true;
  errorMessage: string = '';

  // Bill Items
  billItems: any[] = [];

  // Company Details
  companyDetails: any = null;
  companyName: string = '';
  companyAddress: string = '';
  companyGST: string = '';
  companyPhone: string = '';
  companyEmail: string = '';

  // Invoice Details
  invoiceNumber: string = '';
  invoiceDate: string = '';
  dueDate: string = '';
  status: string = '';
  grandTotal: number = 0;
  paidAmount: number = 0;
  remainingAmount: number = 0;
  subTotal: number = 0;
  discountTotal: number = 0;
  taxableAmount: number = 0;
  cgstAmount: number = 0;
  sgstAmount: number = 0;
  igstAmount: number = 0;
  additionalCharges: number = 0;

  // Customer Details
  customerName: string = '';
  customerAddress: string = '';
  customerGST: string = '';
  customerPhone: string = '';
  customerEmail: string = '';

  // Shipping Details
  shippingAddress: string = '';

  // API URLs
  getInvoiceApiUrl = 'https://billsezy.com/Api/getview-invoice.php';
  companyApiUrl = 'https://billsezy.com/Api/get_company_details.php';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private authService: AuthService
  ) { }

  get userId(): number {
    const userId = this.authService.getUserId();
    return userId || 1;
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.invoiceId = params['id'];
      if (this.invoiceId) {
        this.fetchInvoiceDetails();
        this.fetchCompanyDetails();
      } else {
        this.errorMessage = 'Invoice ID not found';
        this.isLoading = false;
      }
    });
  }

  fetchCompanyDetails() {
    this.http.get<any>(`${this.companyApiUrl}?user_id=${this.userId}`).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.companyDetails = response.data;
          this.companyName = response.data.company_name || response.data.trade_name || '';
          this.companyAddress = response.data.address || '';
          this.companyGST = response.data.gstin || '';
          this.companyPhone = response.data.phone || '';
          this.companyEmail = response.data.email || '';
        }
      },
      error: (err) => console.error('Error fetching company:', err)
    });
  }

  fetchInvoiceDetails() {
    this.isLoading = true;
    
    // 🔥 Send both user_id and invoice_id
    this.http.get<any>(`${this.getInvoiceApiUrl}?user_id=${this.userId}&id=${this.invoiceId}`)
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('Invoice Response:', response);
          
          if (response.status === true) {
            this.invoiceData = response.data;
            this.populateInvoiceData();
          } else {
            this.errorMessage = response.message || 'Invoice not found or unauthorized';
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error:', err);
          this.errorMessage = 'Failed to load invoice';
        }
      });
  }

  populateInvoiceData() {
    const data = this.invoiceData;
    
    // Basic Info
    this.invoiceNumber = data.Bill_no || '';
    this.invoiceDate = data.Invoice_Date ? this.formatDate(data.Invoice_Date) : '';
    this.dueDate = data.Due_Date ? this.formatDate(data.Due_Date) : '';
    this.status = data.Status || 'Unpaid';
    
    // Financial
    this.grandTotal = parseFloat(data.Grand_Total) || 0;
    this.paidAmount = parseFloat(data.Paid_Amount) || 0;
    this.remainingAmount = parseFloat(data.Remaining_Amount) || (this.grandTotal - this.paidAmount);
    this.subTotal = parseFloat(data.sub_total) || 0;
    this.discountTotal = parseFloat(data.Discount) || 0;
    this.taxableAmount = parseFloat(data.taxable_amount) || 0;
    this.cgstAmount = parseFloat(data.cgst_amount) || 0;
    this.sgstAmount = parseFloat(data.sgst_amount) || 0;
    this.igstAmount = parseFloat(data.igst_amount) || 0;
    this.additionalCharges = parseFloat(data.Additional_Charges) || 0;
    
    // Customer Info
    this.customerName = data.Customer_Name || '';
    this.customerAddress = data.customer_address || '';
    this.customerGST = data.customer_gstin || '';
    this.customerPhone = data.customer_phone || '';
    this.customerEmail = data.customer_email || '';
    
    // Product Items
    let products = data.Product_Items;
    if (typeof products === 'string') {
      try {
        products = JSON.parse(products);
      } catch(e) {
        products = [];
      }
    }
    this.billItems = products || [];
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatAmount(amount: number): string {
    if (amount === undefined || amount === null) return '₹0';
    return '₹' + amount.toLocaleString('en-IN', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  }

  getStatusClass(status: string): string {
    switch(status?.toLowerCase()) {
      case 'paid': return 'status-paid';
      case 'partially paid': return 'status-partial';
      case 'unpaid': return 'status-unpaid';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-unpaid';
    }
  }

  goBack() {
    this.router.navigate(['/sales/add-invoice']);
  }

  printInvoice() {
    window.print();
  }

  cancel() {
    if (confirm('Are you sure you want to go back?')) {
      this.router.navigate(['/sales/add-invoice']);
    }
  }
}