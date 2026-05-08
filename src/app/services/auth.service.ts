import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'https://billsezy.com/Api/login.php';

  constructor(
    private router: Router,
    private http: HttpClient
  ) { }

  // Google Login
  googleLogin(googleData: any): Observable<any> {
    const payload = {
      login_type: 'google',
      google_id: googleData.google_id,
      email: googleData.email,
      name: googleData.name,
      avatar: googleData.avatar
    };
    return this.http.post(this.apiUrl, payload);
  }

  // Send OTP
  sendOTP(data: any): Observable<any> {
    const payload = {
      login_type: 'send_otp',
      mobile: data.mobile
    };
    console.log('Sending OTP:', payload);
    return this.http.post(this.apiUrl, payload);
  }

  // Verify OTP
  verifyOTP(data: any): Observable<any> {
    const payload = {
      login_type: 'otp_login',
      mobile: data.mobile,
      otp: data.otp
    };
    console.log('Verifying OTP:', payload);
    return this.http.post(this.apiUrl, payload);
  }

  // Token Methods
  saveToken(token: string) {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  saveUser(user: any) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  getUser(): any | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getUserId(): number | null {
    const user = this.getUser();
    return user?.id || null;
  }

  saveHasSetup(hasSetup: boolean) {
    localStorage.setItem('hasSetup', String(hasSetup));
  }

  getHasSetup(): boolean {
    return localStorage.getItem('hasSetup') === 'true';
  }

  clearHasSetup() {
    localStorage.removeItem('hasSetup');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!(token && token !== 'undefined' && token !== 'null');
  }

  // 🔥 SIMPLE LOGOUT - Just clear localStorage, no API call
  logout() {
    localStorage.clear();
    sessionStorage.clear();
    this.router.navigate(['/authentication/login']);
  }
}