import {
  Component,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';

import { TablerIconsModule } from 'angular-tabler-icons';

import {
  SalesService
} from '../services/sales.service';

@Component({
  selector: 'app-total-sales',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    TablerIconsModule
  ],
  templateUrl: './total-sales.component.html',
  styleUrls: ['./total-sales.component.scss']
})

export class TotalSalesComponent
implements OnChanges {

  @Input() period: string = 'today';

  @Input() userId: number = 1;

  value = 0;
  growth = 0;
  orders = 0;
  paid = 0;
  pending = 0;
  target = 0;
  percentage = 0;

  isLoading = true;

  constructor(
    private salesService: SalesService
  ) { }

  ngOnChanges(
    changes: SimpleChanges
  ): void {

    if (
      changes['period'] ||
      changes['userId']
    ) {

      this.loadData();
    }
  }

  loadData(): void {

    this.isLoading = true;

    this.salesService
      .getDashboardData(
        this.userId,
        this.period
      )

      .subscribe({

        next: (response) => {

          console.log(response);

          if (
            response.status === 'success'
          ) {

            this.value =
              response.data.total_sales.value;

            this.growth =
              response.data.total_sales.growth;

            this.orders =
              response.data.total_sales.orders;

            this.paid =
              response.data.total_sales.paid;

            this.pending =
              response.data.total_sales.pending;

            this.target =
              response.data.total_sales.target;

            this.percentage =
              response.data.total_sales.percentage;
          }

          this.isLoading = false;
        },

        error: (error) => {

          console.log(error);

          this.isLoading = false;
        }
      });
  }

  getPeriodText(): string {

    switch (this.period) {

      case 'today':
        return 'day';

      case 'weekly':
        return 'week';

      case 'monthly':
        return 'month';

      case 'yearly':
        return 'year';

      default:
        return 'time';
    }
  }
}