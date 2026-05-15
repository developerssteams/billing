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

  billItems: any[] = [];

  companyDetails: any = null;
  companyName: string = '';
  companyAddress: string = '';
  companyGST: string = '';
  companyPhone: string = '';
  companyEmail: string = '';
  companyLogo: string = '';

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

  customerName: string = '';
  customerAddress: string = '';
  customerGST: string = '';
  customerPhone: string = '';
  customerEmail: string = '';

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
          this.companyLogo = response.data.logo || '';
        }
      },
      error: (err) => console.error('Error fetching company:', err)
    });
  }

  fetchInvoiceDetails() {
    this.isLoading = true;
    this.http.get<any>(`${this.getInvoiceApiUrl}?user_id=${this.userId}&id=${this.invoiceId}`)
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.status === true) {
            this.invoiceData = response.data;
            this.populateInvoiceData();
          } else {
            this.errorMessage = response.message || 'Invoice not found or unauthorized';
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = 'Failed to load invoice';
        }
      });
  }

  populateInvoiceData() {
    const data = this.invoiceData;
    this.invoiceNumber = data.Bill_no || '';
    this.invoiceDate = data.Invoice_Date ? this.formatDate(data.Invoice_Date) : '';
    this.dueDate = data.Due_Date ? this.formatDate(data.Due_Date) : '';
    this.status = data.Status || 'Unpaid';

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

    this.customerName = data.Customer_Name || '';
    this.customerAddress = data.customer_address || '';
    this.customerGST = data.customer_gstin || '';
    this.customerPhone = data.customer_phone || '';
    this.customerEmail = data.customer_email || '';

    let products = data.Product_Items;
    if (typeof products === 'string') {
      try { products = JSON.parse(products); } catch(e) { products = []; }
    }
    this.billItems = products || [];
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatAmount(amount: number): string {
    if (amount === undefined || amount === null) return '₹0';
    return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
    this.router.navigate(['/sales/invoice']);
  }

  // PERFECT PRINT - Exact same design as view page
  printInvoice() {
    const printContent = document.querySelector('.invoice-container') as HTMLElement;
    if (!printContent) return;

    // Clone the content
    const clone = printContent.cloneNode(true) as HTMLElement;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write('<!DOCTYPE html>');
      printWindow.document.write('<html>');
      printWindow.document.write('<head>');
      printWindow.document.write('<title>Invoice - ' + this.invoiceNumber + '</title>');
      
      // Copy all styles from the page
      const allStyles = document.querySelectorAll('style, link[rel="stylesheet"]');
      allStyles.forEach((style: any) => {
        if (style.tagName === 'STYLE') {
          printWindow.document.write(style.outerHTML);
        } else if (style.tagName === 'LINK' && style.href) {
          printWindow.document.write('<link href="' + style.href + '" rel="stylesheet">');
        }
      });
      
      // Add print-specific styles to maintain exact design
      printWindow.document.write(`
        <style>
          /* Hide non-print elements */
          .header,
          .loading-overlay,
          .error-container,
          .right-box-actions,
          .cancel-btn,
          .print-btn,
          .back-btn {
            display: none !important;
          }
          
          /* Ensure invoice container looks exactly like view */
          body {
            margin: 0;
            padding: 20px;
            background: #f3f4f6;
            font-family: Arial, Helvetica, sans-serif;
          }
          
          .invoice-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.15);
            padding: 35px;
          }
          
          /* Print styles */
          @media print {
            body {
              margin: 0;
              padding: 0;
              background: white;
            }
            
            .invoice-container {
              margin: 0 auto;
              padding: 40px 35px;
              box-shadow: none;
              border-radius: 0;
              max-width: 100%;
            }
            
            /* Keep all colors and backgrounds */
            .status-badge,
            .invoice-table th,
            .invoice-right,
            .summary-card,
            .bill-to,
            .shipping-to,
            .bank-details,
            .terms {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            /* Prevent page breaks inside sections */
            .invoice-header-wrapper,
            .bill-section,
            .summary-wrapper,
            .invoice-footer {
              break-inside: avoid;
              page-break-inside: avoid;
            }
            
            .table-wrapper {
              overflow-x: visible;
            }
            
            .invoice-table {
              min-width: auto;
            }
            
            .invoice-table td,
            .invoice-table th {
              border: 1px solid #e5e7eb;
            }
          }
          
          @page {
            margin: 1.5cm;
            size: A4;
          }
        </style>
      `);
      
      printWindow.document.write('</head>');
      printWindow.document.write('<body>');
      printWindow.document.write(clone.outerHTML);
      printWindow.document.write('</body>');
      printWindow.document.write('</html>');

      printWindow.document.close();
      printWindow.focus();
      
      // Print and then close
      printWindow.print();
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    }
  }

  cancel() {
    if (confirm('Are you sure you want to go back?')) {
      this.router.navigate(['/sales/invoice']);
    }
  }
}