import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { TablerIconsModule } from 'angular-tabler-icons';

@Component({
  selector: 'app-expense',
  standalone: true,
  imports: [CommonModule, MatCardModule, TablerIconsModule],
  templateUrl: './expense.component.html',
  styleUrls: ['./expense.component.scss']
})
export class ExpenseComponent {
  @Input() value: number = 9850;
  @Input() growth: number = 8.3;
  @Input() category: string = 'Operating';
  @Input() totalExpenses: number = 24500;
  @Input() percentage: number = 40;
}