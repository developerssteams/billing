import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { TablerIconsModule } from 'angular-tabler-icons';

@Component({
  selector: 'app-total-sales',
  standalone: true,
  imports: [CommonModule, MatCardModule, TablerIconsModule],
  templateUrl: './total-sales.component.html',
  styleUrls: ['./total-sales.component.scss']
})
export class TotalSalesComponent {
  @Input() value: number = 45680;
  @Input() growth: number = 12.5;
  @Input() target: number = 50000;
  @Input() orders: number = 342;
  @Input() percentage: number = 78;
}