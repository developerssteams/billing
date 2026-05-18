import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { TablerIconsModule } from 'angular-tabler-icons';

@Component({
  selector: 'app-purchase-due',
  standalone: true,
  imports: [CommonModule, MatCardModule, TablerIconsModule],
  templateUrl: './purchase-due.component.html',
  styleUrls: ['./purchase-due.component.scss']
})
export class PurchaseDueComponent {
  @Input() amount: number = 28450;
  @Input() growth: number = 5.2;
  @Input() duePercentage: number = 65;
  @Input() pendingInvoices: number = 24;
  @Input() dueDate: string = '30 May 2026';
}