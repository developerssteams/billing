import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SalesData {
  value: number;
  growth: number;
  orders: number;
  paid: number;
  pending: number;
  target: number;
  percentage: number;
}

export interface DashboardResponse {
  status: string;
  data: {
    total_sales: SalesData;
  };
}

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private apiUrl = 'https://billsezy.com/Api/Dashboard-Data.php'; // Change this to your actual API URL

  constructor(private http: HttpClient) { }

  getDashboardData(userId: number, period: string): Observable<DashboardResponse> {
    const params = new HttpParams()
      .set('user_id', userId.toString())
      .set('period', period);
    
    return this.http.get<DashboardResponse>(this.apiUrl, { params });
  }
}