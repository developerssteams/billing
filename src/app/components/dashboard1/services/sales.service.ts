import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardData {
  success: boolean;
  period: string;
  data: {
    total_sales: {
      value: number;
      growth: number;
      orders: number;
      target: number;
      percentage: number;
    };
    total_purchase: {
      value: number;
      growth: number;
      orders: number;
      budget: number;
      percentage: number;
    };
    purchase_due: {
      value: number;
      growth: number;
      invoices: number;
      due_percentage: number;
    };
    sales_due: {
      value: number;
      growth: number;
      invoices: number;
      due_percentage: number;
    };
    expense: {
      value: number;
      growth: number;
      budget: number;
      percentage: number;
    };
    customers: {
      value: number;
      new_customers: number;
      active_rate: number;
      active_customers: number;
    };
    suppliers: {
      value: number;
      new_suppliers: number;
      active_rate: number;
      active_suppliers: number;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  // Change this URL to your actual API URL
  private apiUrl = 'https://billsezy.com/Api/Dashboard-Data.php';

  constructor(private http: HttpClient) {}

  getDashboardData(period: string): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.apiUrl}?period=${period}`);
  }
}