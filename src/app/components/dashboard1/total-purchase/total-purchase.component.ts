import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { TablerIconsModule } from 'angular-tabler-icons';

@Component({
  selector: 'app-total-purchase',
  standalone: true,
  imports: [CommonModule, MatCardModule, TablerIconsModule],
  templateUrl: './total-purchase.component.html',
  styleUrls: ['./total-purchase.component.scss']
})
export class TotalPurchaseComponent {
  @Input() value: number = 28450;
  @Input() growth: number = 5.2;
  @Input() budget: number = 35000;
  @Input() purchaseOrders: number = 156;
  @Input() percentage: number = 65;
}