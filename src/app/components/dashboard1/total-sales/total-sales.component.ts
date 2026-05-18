import { Component, Input, OnChanges } from '@angular/core';
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
  @Input() period: string = 'monthly';
  @Input() userId: number = 1;

  value: number = 0;
  growth: number = 0;
  orders: number = 0;
  paid: number = 0;
  pending: number = 0;
  target: number = 50000;
  percentage: number = 0;
  isLoading: boolean = true;

  constructor(private salesService: SalesService) { }

  ngOnChanges() {
    this.loadData();
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
        console.error('Error:', err);
        this.isLoading = false;
        this.setDummyData();
      }
    });
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
  setDummyData() {
    const dummy: any = {
      today: { value: 4580, growth: 8.5, orders: 12, paid: 3500, pending: 1080, percentage: 9 },
      weekly: { value: 28500, growth: 12.3, orders: 78, paid: 21000, pending: 7500, percentage: 57 },
      monthly: { value: 45680, growth: 15.2, orders: 342, paid: 38000, pending: 7680, percentage: 91 },
      yearly: { value: 425000, growth: 18.5, orders: 2850, paid: 380000, pending: 45000, percentage: 100 },
      all: { value: 1250000, growth: 25.5, orders: 8500, paid: 1100000, pending: 150000, percentage: 100 }
    };
    const data = dummy[this.period] || dummy.monthly;
    this.value = data.value;
    this.growth = data.growth;
    this.orders = data.orders;
    this.paid = data.paid;
    this.pending = data.pending;
    this.percentage = data.percentage;
  }
}