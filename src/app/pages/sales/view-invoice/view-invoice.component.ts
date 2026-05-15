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

  // FIXED: Print with proper copies and navigation
  printInvoice() {
    const printContent = document.querySelector('.invoice-container') as HTMLElement;
    if (!printContent) return;

    // Create two copies
    const originalClone = printContent.cloneNode(true) as HTMLElement;
    const duplicateClone = printContent.cloneNode(true) as HTMLElement;

    // Add copy type headers
    this.addCopyTypeToClone(originalClone, 'ORIGINAL', 'ORIGINAL FOR RECIPIENT', 'This is a system generated invoice and does not require physical signature.');
    this.addCopyTypeToClone(duplicateClone, 'DUPLICATE', 'DUPLICATE FOR RECORDS', 'This is a copy for your records. Please retain for future reference.');

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write('<!DOCTYPE html>');
      printWindow.document.write('<html>');
      printWindow.document.write('<head>');
      printWindow.document.write('<title>Invoice - ' + this.invoiceNumber + '</title>');
      printWindow.document.write('<style>');
      printWindow.document.write(`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: Arial, Helvetica, sans-serif; 
          background: white;
          margin: 0;
          padding: 0;
        }
        .invoice-copy { 
          max-width: 1200px; 
          margin: 0 auto; 
          background: white; 
          padding: 40px 35px !important;
          page-break-after: always;
          position: relative;
        }
        .copy-header { 
          text-align: center; 
          margin-bottom: 25px; 
          padding-top: 10px;
        }
        .copy-title { 
          font-size: 20px; 
          font-weight: bold; 
          letter-spacing: 2px;
          color: #1f2937;
        }
        .copy-subtitle { 
          font-size: 11px; 
          color: #6b7280; 
          margin-top: 5px; 
          font-style: italic;
        }
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 70px;
          font-weight: bold;
          color: rgba(0,0,0,0.08);
          white-space: nowrap;
          pointer-events: none;
          z-index: 1000;
          font-family: Arial, sans-serif;
        }
        .invoice-header-wrapper { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 35px; 
          padding-bottom: 25px; 
          border-bottom: 2px dashed #e5e7eb; 
          flex-wrap: wrap; 
          gap: 30px; 
        }
        .invoice-left { flex: 1; }
        .company-logo-img { max-width: 150px; max-height: 80px; object-fit: contain; margin-bottom: 15px; }
        .company-logo h2 { font-size: 34px; font-weight: 800; margin: 0 0 15px 0; }
        .company-details h3 { font-size: 20px; font-weight: 700; margin: 0 0 8px 0; color: #1f2937; }
        .company-details p { font-size: 13px; color: #6b7280; margin: 5px 0; }
        .invoice-right { background: #f8fafc; padding: 20px 28px; border-radius: 14px; min-width: 280px; }
        .invoice-right > div { display: flex; justify-content: space-between; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0; }
        .label { font-weight: 600; color: #475569; font-size: 13px; }
        .value { color: #1e293b; font-weight: 600; font-size: 14px; }
        .status-badge { padding: 5px 14px; border-radius: 30px; font-size: 12px; font-weight: 700; }
        .status-paid { background: #d1fae5; color: #065f46; }
        .status-partial { background: #fef3c7; color: #92400e; }
        .status-unpaid { background: #fee2e2; color: #991b1b; }
        .bill-section { display: flex; gap: 40px; margin-bottom: 35px; flex-wrap: wrap; }
        .bill-to, .shipping-to { flex: 1; background: #fafbff; padding: 20px 24px; border-radius: 12px; border-left: 4px solid #165a50; }
        .bill-to h4, .shipping-to h4 { font-size: 14px; font-weight: 700; color: #165a50; margin: 0 0 14px 0; text-transform: uppercase; }
        .customer-name { font-weight: 700; color: #1f2937; font-size: 15px; margin-bottom: 10px; }
        .table-wrapper { overflow-x: auto; margin-bottom: 30px; }
        .invoice-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 800px; }
        .invoice-table th { background: #f8fafc; padding: 14px 12px; text-align: center; font-weight: 700; border-bottom: 2px solid #e5e7eb; }
        .invoice-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .summary-wrapper { display: flex; gap: 40px; margin-bottom: 30px; flex-wrap: wrap; }
        .bank-terms { flex: 1; }
        .bank-details, .terms { background: #fafbff; padding: 16px 20px; border-radius: 10px; margin-bottom: 15px; }
        .bank-details h5, .terms h5 { font-size: 13px; font-weight: 700; color: #165a50; margin: 0 0 10px 0; }
        .bank-details p, .terms p { font-size: 12px; color: #6b7280; margin: 5px 0; }
        .summary-card { width: 340px; background: #f8fafc; padding: 20px 24px; border-radius: 14px; border: 1px solid #e5e7eb; }
        .summary-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
        .summary-row.grand-total { font-size: 17px; font-weight: 800; border-top: 2px solid #e5e7eb; margin-top: 8px; padding-top: 14px; }
        .invoice-footer { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 25px; border-top: 2px dashed #e5e7eb; flex-wrap: wrap; }
        .signature-line { width: 180px; height: 1px; background: #cbd5e1; margin-bottom: 8px; }
        .for-receipt-text { text-align: right; margin-top: 20px; padding-top: 15px; border-top: 1px dashed #e5e7eb; }
        .light-gray { font-size: 12px; color: #9ca3af; font-style: italic; }
        .product-name { font-weight: 600; color: #1e293b; font-size: 14px; margin-bottom: 4px; }
        
        @media print {
          body { margin: 0; padding: 0; }
          .invoice-copy { 
            page-break-after: always; 
            margin: 0; 
            padding: 40px 35px !important;
            break-inside: avoid;
          }
          .status-badge, .invoice-table th {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
        @page { 
          margin: 1.2cm; 
          size: A4;
        }
      `);
      printWindow.document.write('</style>');
      printWindow.document.write('</head>');
      printWindow.document.write('<body>');
      printWindow.document.write(originalClone.outerHTML);
      printWindow.document.write(duplicateClone.outerHTML);
      printWindow.document.write('</body>');
      printWindow.document.write('</html>');

      printWindow.document.close();
      printWindow.focus();
      
      // After print dialog closes, navigate back to invoice list
      printWindow.onafterprint = () => {
        printWindow.close();
        this.router.navigate(['/sales/invoice']);
      };
      
      printWindow.print();
    }
  }

  addCopyTypeToClone(clone: HTMLElement, type: string, title: string, subtitle: string) {
    // Add watermark
    const watermark = document.createElement('div');
    watermark.className = 'watermark';
    watermark.innerText = type;
    clone.style.position = 'relative';
    clone.appendChild(watermark);
    
    // Add copy header
    const copyHeader = document.createElement('div');
    copyHeader.className = 'copy-header';
    copyHeader.innerHTML = `
      <div class="copy-title">${title}</div>
      <div class="copy-subtitle">${subtitle}</div>
    `;
    clone.insertBefore(copyHeader, clone.firstChild);

    // Update the "For Receipt" text
    const forReceiptText = clone.querySelector('.for-receipt-text');
    if (forReceiptText) {
      forReceiptText.innerHTML = `<span class="light-gray">For ${this.companyName}</span>`;
    }
    
    // Add class for styling
    clone.classList.add('invoice-copy');
  }

  cancel() {
    // Navigate back to the same view-invoice page with the same ID
    this.router.navigate(['/sales/view-invoice'], { queryParams: { id: this.invoiceId } });
  }
}