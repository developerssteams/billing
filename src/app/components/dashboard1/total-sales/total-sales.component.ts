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
  target: number = 50000;
  percentage: number = 0;
  isLoading: boolean = true;

  constructor(private salesService: SalesService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['period'] || changes['userId']) {
      this.loadData();
    }
  }

  loadData(): void {
    this.isLoading = true;
    
    this.salesService.getDashboardData(this.userId, this.period).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.value = response.data.total_sales.value;
          this.growth = response.data.total_sales.growth;
          this.orders = response.data.total_sales.orders;
          this.paid = response.data.total_sales.paid;
          this.pending = response.data.total_sales.pending;
          this.target = response.data.total_sales.target;
          this.percentage = response.data.total_sales.percentage;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error:', error);
        this.isLoading = false;
        this.setDummyData();
      }
    });
  }

  getComparisonText(): string {
    switch (this.period) {
      case 'today': return 'day';
      case 'weekly': return 'week';
      case 'monthly': return 'month';
      case 'yearly': return 'year';
      default: return 'period';
    }
  }

  setDummyData() {
    const dummyData: any = {
      'today': { value: 54350, growth: -5.2 },
      'weekly': { value: 54350, growth: 8.3 },
      'monthly': { value: 54350, growth: 11.5 },
      'yearly': { value: 54350, growth: -3.2 },
      'all': { value: 54350, growth: 0 }
    };
    
    const data = dummyData[this.period] || dummyData.monthly;
    this.value = data.value;
    this.growth = data.growth;
  }
}