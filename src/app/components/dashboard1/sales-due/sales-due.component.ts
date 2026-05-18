import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { TablerIconsModule } from 'angular-tabler-icons';

@Component({
  selector: 'app-sales-due',
  standalone: true,
  imports: [CommonModule, MatCardModule, TablerIconsModule],
  templateUrl: './sales-due.component.html',
  styleUrls: ['./sales-due.component.scss']
})
export class SalesDueComponent {
  @Input() value: number = 12560;
  @Input() growth: number = 7.95;
  @Input() dueDays: number = 15;
  @Input() dueCount: number = 8;
  @Input() percentage: number = 25;
}