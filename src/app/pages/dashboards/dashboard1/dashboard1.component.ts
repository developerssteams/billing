import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { TablerIconsModule } from 'angular-tabler-icons';

// Import new components
import { TotalSalesComponent } from 'src/app/components/dashboard1/total-sales/total-sales.component';
import { TotalPurchaseComponent } from 'src/app/components/dashboard1/total-purchase/total-purchase.component';
import { PurchaseDueComponent } from 'src/app/components/dashboard1/purchase-due/purchase-due.component';
import { SalesDueComponent } from 'src/app/components/dashboard1/sales-due/sales-due.component';
import { ExpenseComponent } from 'src/app/components/dashboard1/expense/expense.component';
import { CustomersComponent } from 'src/app/components/dashboard1/customers/customers.component';
import { SuppliersComponent } from 'src/app/components/dashboard1/supliers/supliers.component';

@Component({
  selector: 'app-dashboard1',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    TablerIconsModule,
    // New components
    TotalSalesComponent,
    TotalPurchaseComponent,
    PurchaseDueComponent,
    SalesDueComponent,
    ExpenseComponent,
    CustomersComponent,
    SuppliersComponent,
  ],
  templateUrl: './dashboard1.component.html',
})
export class AppDashboard1Component {
  activeTab = 'today';
  
  tabs = [
    { label: 'Today', value: 'today' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' },
    { label: 'All', value: 'all' }
  ];
}