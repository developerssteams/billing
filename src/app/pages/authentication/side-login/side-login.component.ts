import { Component, OnDestroy } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { BrandingComponent } from 'src/app/layouts/full/vertical/sidebar/branding.component';

declare var google: any;

@Component({
  selector: 'app-side-login',
  imports: [
    RouterModule,
    MaterialModule,
    FormsModule,
    BrandingComponent,
    CommonModule,
    MatIconModule
  ],
  templateUrl: './side-login.component.html'
})
export class AppSideLoginComponent implements OnDestroy {

  options = this.settings.getOptions();
  isLoading: boolean = false;
  isLoadingOTP: boolean = false;
  isLoadingVerify: boolean = false;
  otpSent: boolean = false;
  showWelcomeModal: boolean = false;
  mobileNumber: string = '';
  otpDigits: string[] = ['', '', '', '', '', ''];
  timer: number = 0;
  private timerInterval: any;

  private readonly GOOGLE_CLIENT_ID = '113844503757-9kvrui7inbgd19ta43k373s8voa7vv6i.apps.googleusercontent.com';

  errorMsg: any = {
    otp: ''
  };

  constructor(
    private settings: CoreService,
    private router: Router,
    private auth: AuthService
  ) {
    console.log('🟢 AppSideLoginComponent Initialized');
  }

  ngOnInit() {
    console.log('🟢 ngOnInit called');
    console.log('🟢 Google Client ID:', this.GOOGLE_CLIENT_ID);
    this.loadGoogleSDK();
    this.clearErrors();
  }

  ngOnDestroy() {
    console.log('🟢 ngOnDestroy called, cleaning up timer');
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  clearErrors() {
    console.log('🟢 Clearing errors');
    this.errorMsg = { otp: '' };
  }

  get isValidMobile(): boolean {
    const isValid = /^[6-9]\d{9}$/.test(this.mobileNumber);
    console.log('🟢 isValidMobile check:', this.mobileNumber, '=>', isValid);
    return isValid;
  }

  get isOtpComplete(): boolean {
    const isComplete = this.otpDigits.every(digit => digit.length === 1);
    console.log('🟢 isOtpComplete:', isComplete, 'OTP Digits:', this.otpDigits);
    return isComplete;
  }

  closeWelcomeModal() {
    console.log('🟢 Closing welcome modal');
    this.showWelcomeModal = false;
  }

  loadGoogleSDK() {
    console.log('🟢 Loading Google SDK...');
    if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      console.log('🟢 Google SDK script already exists');
      this.initGoogle();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('🟢 Google SDK loaded successfully');
      this.initGoogle();
    };
    script.onerror = () => {
      console.error('🔴 Failed to load Google SDK');
    };
    document.body.appendChild(script);
  }

  initGoogle() {
    console.log('🟢 Initializing Google...');
    if (typeof google === 'undefined' || !google.accounts) {
      console.log('🟢 Google not ready yet, retrying in 500ms...');
      setTimeout(() => this.initGoogle(), 500);
      return;
    }

    console.log('🟢 Google accounts available, initializing...');
    google.accounts.id.initialize({
      client_id: this.GOOGLE_CLIENT_ID,
      callback: (response: any) => {
        console.log('🟢 Google callback received');
        this.handleGoogleCredential(response);
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    console.log('🟢 Google initialized successfully');
  }
  // Add this method to your component

  handleLoginClick() {
    if (!this.otpSent) {
      // First step: Send OTP
      this.sendOTP();
    } else {
      // Second step: Verify OTP and Login
      this.verifyOTP();
    }
  }
  googleLogin() {
    console.log('🟢 googleLogin() called');
    this.isLoading = true;
    if (typeof google === 'undefined' || !google.accounts) {
      console.error('🔴 Google not ready');
      this.errorMsg.otp = 'Google login not ready. Refresh page.';
      this.isLoading = false;
      return;
    }

    console.log('�9 Showing Google prompt...');
    google.accounts.id.prompt((notification: any) => {
      console.log('🟢 Google prompt notification:', notification);
      if (notification?.isNotDisplayed?.()) {
        console.error('🔴 Popup blocked');
        this.errorMsg.otp = 'Popup blocked. Please enable popups.';
        this.isLoading = false;
      }
    });
  }

  handleGoogleCredential(response: any) {
    console.log('🟢 handleGoogleCredential called');
    console.log('🟢 Response:', response);

    if (!response?.credential) {
      console.error('🔴 No credential received');
      this.errorMsg.otp = 'No credential received';
      this.isLoading = false;
      return;
    }

    try {
      console.log('🟢 Decoding JWT...');
      const payload = this.decodeJwt(response.credential);
      console.log('🟢 Decoded payload:', payload);

      if (!payload?.email) {
        console.error('🔴 No email in payload');
        this.errorMsg.otp = 'Could not get email from Google';
        this.isLoading = false;
        return;
      }

      const googleData = {
        login_type: 'google',
        google_id: payload.sub,
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        avatar: payload.picture || ''
      };

      console.log('🟢 Sending Google data to auth service:', googleData);

      this.auth.googleLogin(googleData).subscribe({
        next: (res: any) => {
          console.log('🟢 Google login response received:', res);
          this.isLoading = false;
          if (res?.status === true) {
            console.log('🟢 Google login successful');
            this.auth.saveToken(res.token);
            this.auth.saveUser(res.user);
            localStorage.setItem('user', JSON.stringify(res.user));
            sessionStorage.setItem('justLoggedIn', 'true');

            if (res.hasSetup !== undefined) {
              this.auth.saveHasSetup(res.hasSetup === true);
            } else {
              this.auth.saveHasSetup(false);
            }

            console.log('🟢 Navigating to dashboard...');
            this.router.navigate(['/dashboards/dashboard1']);
          } else {
            console.error('🔴 Google login failed:', res?.message);
            this.errorMsg.otp = res?.message || 'Google login failed';
          }
        },
        error: (err) => {
          console.error('🔴 Google login HTTP error:', err);
          this.isLoading = false;
          this.errorMsg.otp = 'Server error. Please try again.';
        }
      });
    } catch (error) {
      console.error('🔴 Error handling Google response:', error);
      this.errorMsg.otp = 'Invalid Google response';
      this.isLoading = false;
    }
  }

  sendOTP() {
    console.log('🟢 sendOTP() called');
    console.log('🟢 Current mobile number:', this.mobileNumber);

    if (!this.isValidMobile) {
      console.error('🔴 Invalid mobile number');
      this.errorMsg.otp = 'Please enter a valid 10 digit mobile number';
      return;
    }

    this.isLoadingOTP = true;
    this.clearErrors();

    const payload = { mobile: this.mobileNumber };
    console.log('🟢 Calling auth.sendOTP with:', payload);

    this.auth.sendOTP(payload).subscribe({
      next: (res: any) => {
        console.log('🟢 Send OTP Response FULL:', JSON.stringify(res));
        console.log('🟢 Response status:', res.status);
        console.log('🟢 Response message:', res.message);
        console.log('🟢 Response OTP:', res.otp);

        this.isLoadingOTP = false;

        if (res.status === true) {
          console.log('🟢 OTP sent successfully!');
          this.otpSent = true;
          this.startTimer(60);
          this.errorMsg.otp = '';
          this.otpDigits = ['', '', '', '', '', ''];
        } else {
          console.error('🔴 Failed to send OTP:', res.message);
          this.errorMsg.otp = res.message || 'Failed to send OTP';
        }
      },
      error: (err) => {
        console.error('🔴 Send OTP HTTP Error:', err);
        console.error('🔴 Error status:', err.status);
        console.error('🔴 Error message:', err.message);
        console.error('🔴 Error object:', JSON.stringify(err));
        this.isLoadingOTP = false;
        this.errorMsg.otp = 'Server error. Please try again.';
      }
    });
  }

  resendOTP() {
    console.log('🟢 resendOTP() called, timer:', this.timer);
    if (this.timer > 0) {
      console.log('🔴 Cannot resend, timer active');
      return;
    }
    this.sendOTP();
  }

  verifyOTP() {
    console.log('🟢 verifyOTP() called');
    console.log('🟢 OTP Digits:', this.otpDigits);

    if (!this.isOtpComplete) {
      console.error('🔴 OTP incomplete');
      this.errorMsg.otp = 'Please enter complete 6 digit OTP';
      return;
    }

    this.isLoadingVerify = true;
    const enteredOtp = this.otpDigits.join('');

    console.log('🟢 Entered OTP:', enteredOtp);
    console.log('🟢 Mobile Number:', this.mobileNumber);

    const payload = { mobile: this.mobileNumber, otp: enteredOtp };
    console.log('🟢 Calling auth.verifyOTP with:', payload);

    this.auth.verifyOTP(payload).subscribe({
      next: (res: any) => {
        console.log('🟢 Verify OTP Response FULL:', JSON.stringify(res));
        console.log('🟢 Response status:', res.status);
        console.log('🟢 Response message:', res.message);

        this.isLoadingVerify = false;

        if (res.status === true) {
          console.log('🟢 OTP verification successful!');
          console.log('🟢 User data:', res.user);
          console.log('🟢 Token:', res.token?.substring(0, 30) + '...');

          this.auth.saveToken(res.token);
          this.auth.saveUser(res.user);
          localStorage.setItem('user', JSON.stringify(res.user));
          sessionStorage.setItem('justLoggedIn', 'true');

          if (res.hasSetup !== undefined) {
            this.auth.saveHasSetup(res.hasSetup === true);
          } else {
            this.auth.saveHasSetup(false);
          }

          console.log('🟢 Navigating to dashboard...');
          this.router.navigate(['/dashboards/dashboard1']);
        } else {
          console.error('🔴 OTP verification failed:', res.message);
          this.errorMsg.otp = res.message || 'Invalid OTP';
          this.otpDigits = ['', '', '', '', '', ''];
        }
      },
      error: (err) => {
        console.error('🔴 Verify OTP HTTP Error:', err);
        console.error('🔴 Error status:', err.status);
        console.error('🔴 Error message:', err.message);
        this.isLoadingVerify = false;
        this.errorMsg.otp = 'Server error. Please try again.';
        this.otpDigits = ['', '', '', '', '', ''];
      }
    });
  }

  startTimer(seconds: number) {
    console.log('🟢 Starting timer for', seconds, 'seconds');
    this.timer = seconds;
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.timer > 0) {
        this.timer--;
        if (this.timer % 10 === 0) {
          console.log('🟢 Timer:', this.timer);
        }
      } else {
        console.log('🟢 Timer finished');
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }

  onOtpInput(index: number, event: any) {
    const value = event.target.value;
    console.log(`🟢 OTP Input ${index}:`, value);

    if (value && /^\d$/.test(value)) {
      this.otpDigits[index] = value;
      if (index < 5) {
        const nextInput = document.querySelectorAll('.otp-digit')[index + 1] as HTMLInputElement;
        if (nextInput) nextInput.focus();
      }
      if (index === 5) {
        console.log('🟢 Last digit entered, auto-verifying...');
        setTimeout(() => this.verifyOTP(), 100);
      }
    } else if (value === '') {
      this.otpDigits[index] = '';
    } else {
      this.otpDigits[index] = '';
      event.target.value = '';
    }
  }

  onOtpKeydown(index: number, event: any) {
    if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) {
      const prevInput = document.querySelectorAll('.otp-digit')[index - 1] as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
        this.otpDigits[index - 1] = '';
      }
    }
  }

  decodeJwt(token: string): any {
    try {
      console.log('🟢 Decoding JWT token...');
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const decoded = JSON.parse(jsonPayload);
      console.log('🟢 Decoded JWT:', decoded);
      return decoded;
    } catch (e) {
      console.error('🔴 Error decoding JWT:', e);
      return null;
    }
  }
}