import { Routes } from '@angular/router';

import { InvoicesComponent } from './sales/invoices/invoices.component';
import { CreateInvoiceComponent } from './sales/create-invoice/create-invoice.component';
import { ViewInvoiceComponent } from './sales/view-invoice/view-invoice.component';
import { CreditNotesComponent } from './sales/credit-notes/credit-notes.component';
import { EInvoiceComponent } from './sales/e-invoice/e-invoice.component';
import { CreateCreditNoteComponent } from './sales/create-credit-note/create-credit-note.component';
import { PurchaseComponent } from './purchase/purchase/purchase.component';
import { DebitNotesComponent } from './purchase/debit-notes/debit-notes.component';
import { CreatePurchaseComponent } from './purchase/create-purchase/create-purchase.component';
import { CreateDebitNoteComponent } from './purchase/create-debit-note/create-debit-note.component';
import { QuotationListComponent } from './quotations/quotation-list/quotation-list.component';
import { SalesOrdersComponent } from './quotations/sales-orders/sales-orders.component';
import { ProformaComponent } from './quotations/proforma/proforma.component';
import { DeliveryComponent } from './quotations/delivery/delivery.component';
import { EwayBillsComponent } from './eway-bills/eway-bills/eway-bills.component';
import { ExpensesListComponent } from './expenses/expenses-list/expenses-list.component';
import { AddProductComponent } from './products/add-product/add-product.component';
import { TimelineComponent } from './payments/timeline/timeline.component';
import { PaymentLinksComponent } from './payments/payment-links/payment-links.component';
import { JournalsComponent } from './payments/journals/journals.component';
import { BankReconciliationComponent } from './payments/bank-reconciliation/bank-reconciliation.component';
import { CustomersComponent } from './customers/customers/customers.component';
import { VendorsComponent } from './vendors/vendors/vendors.component';
import { SalesReportsComponent } from './reports/sales-reports/sales-reports.component';
import { PurchaseReportsComponent } from './reports/purchase-reports/purchase-reports.component';
import { SettingsComponent } from './settings/settings/settings.component';

export const PagesRoutes: Routes = [

  // ⚠️  SALES ROUTES
  { path: 'add-invoice', component: InvoicesComponent },
  { path: 'create-invoice', component: CreateInvoiceComponent },
  { path: 'view-invoice', component: ViewInvoiceComponent },
  { path: 'credit-notes', component: CreditNotesComponent },
  { path: 'create-credit-note', component: CreateCreditNoteComponent },
  { path: 'e-invoice', component: EInvoiceComponent },
  // 🔥 PURCHASE ROUTES
  { path: 'add-purchase', component: PurchaseComponent },
  { path: 'debit-notes', component: DebitNotesComponent },
  { path: 'create-debit-note', component: CreateDebitNoteComponent },
  { path: 'create-purchase', component: CreatePurchaseComponent },

  // 🔥 QUOTATIONS ROUTES
  { path: 'list', component: QuotationListComponent },
  { path: 'sales-orders', component: SalesOrdersComponent },
  { path: 'proforma', component: ProformaComponent },
  { path: 'delivery', component: DeliveryComponent },
  // 🔥 E-WAY BILL
  { path: 'eway-bills', component: EwayBillsComponent },
  // 🔥 EXPENSES ROUTES
  { path: 'expenseslist', component: ExpensesListComponent },
  // 🔥 PRODUCTS ROUTES
  { path: 'add-product', component: AddProductComponent },
  // 🔥 PAYMENTS ROUTES
  { path: 'timeline', component: TimelineComponent },
  { path: 'payment-links', component: PaymentLinksComponent },
  { path: 'journals', component: JournalsComponent },
  { path: 'bank-reconciliation', component: BankReconciliationComponent },
  // 🔥 CUSTOMERS ROUTE
  { path: 'customers', component: CustomersComponent },
  // 🔥 VENDORS ROUTE
  { path: 'vendors', component: VendorsComponent },
  // 🔥 REPORTS ROUTES
  { path: 'sales-reports', component: SalesReportsComponent },
  { path: 'purchase-reports', component: PurchaseReportsComponent },
  // 🔥 SETTINGS ROUTE
  { path: 'settings', component: SettingsComponent },
];