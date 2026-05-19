import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { TablerIconsModule } from 'angular-tabler-icons';
import { SalesService } from '../services/sales.service';

@Component({
  selector: 'app-total-sales',
  standalone: true,
  imports: [CommonModule, MatCardModule, TablerIconsModule],
  templateUrl: './total-sales.component.html',
  styleUrls: ['./total-sales.component.scss']
})
export class TotalSalesComponent implements OnChanges {
  @Input() period: string = 'today';
  @Input() userId: number = 1;

  value: number = 0;
  growth: number = 0;
  orders: number = 0;
  paid: number = 0;
  pending: number = 0;
  target: number = 0;
  percentage: number = 0;
  isLoading: boolean = true;

  constructor(private salesService: SalesService) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['period'] || changes['userId']) {
      this.loadData();
    }
  }

  loadData() {
    this.isLoading = true;
    this.salesService.getDashboardData(this.userId, this.period).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.value = res.data.total_sales.value;
          this.growth = res.data.total_sales.growth;
          this.orders = res.data.total_sales.orders;
          this.paid = res.data.total_sales.paid;
          this.pending = res.data.total_sales.pending;
          this.target = res.data.total_sales.target;
          this.percentage = res.data.total_sales.percentage;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading sales data:', err);
        this.isLoading = false;
        // Fallback to dummy data if API fails
        this.setFallbackData();
      }
    });
  }

  setFallbackData() {
    // This will use your existing sales_invoices table data
    // API should work, this is just backup
    const dummyData = {
      value: 0,
      growth: 0,
      orders: 0,
      paid: 0,
      pending: 0,
      target: this.getTargetForPeriod(),
      percentage: 0
    };
    this.value = dummyData.value;
    this.growth = dummyData.growth;
    this.orders = dummyData.orders;
    this.paid = dummyData.paid;
    this.pending = dummyData.pending;
    this.percentage = dummyData.percentage;
  }

  getTargetForPeriod(): number {
    const targets: Record<string, number> = {
      'today': 10000,
      'weekly': 50000,
      'monthly': 200000,
      'yearly': 1500000,
      'all': 2000000
    };
    return targets[this.period] || 50000;
  }

  getPeriodText(): string {
    switch (this.period) {
      case 'today': return 'day';
      case 'weekly': return 'week';
      case 'monthly': return 'month';
      case 'yearly': return 'year';
      default: return 'period';
    }
  }
}