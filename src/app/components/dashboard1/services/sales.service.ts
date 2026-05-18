import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardData {
  status: string;
  period: string;
  data: {
    total_sales: {
      value: number;
      growth: number;
      orders: number;
      paid: number;
      pending: number;
      target: number;
      percentage: number;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private apiUrl = 'https://billsezy.com/Api/Dashboard-Data.php';

  constructor(private http: HttpClient) {}

  getDashboardData(userId: number, period: string): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.apiUrl}?user_id=${userId}&period=${period}`);
  }
}