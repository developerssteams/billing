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
  @Input() period: string = 'today';
  
  value: number = 0;
  growth: number = 0;
  orders: number = 0;
  target: number = 50000;
  percentage: number = 0;
  isLoading: boolean = true;

  constructor(private salesService: SalesService) {}

  ngOnChanges() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.salesService.getDashboardData(this.period).subscribe({
      next: (res) => {
        if (res.success) {
          this.value = res.data.total_sales.value;
          this.growth = res.data.total_sales.growth;
          this.orders = res.data.total_sales.orders;
          this.percentage = res.data.total_sales.percentage;
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}