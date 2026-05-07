import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-welcome-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './welcome-modal.component.html',
  styleUrls: ['./welcome-modal.component.scss']
})
export class WelcomeModalComponent {

  @Output() closeModal = new EventEmitter<void>();

  step: string = 'success';
  userName: string = '';
  isNewUser: boolean = true;
  isLoading: boolean = false;
  isFetchingGst: boolean = false;
  gstError: string = '';
  panError: string = '';

  companyData: any = {
    gstin: '',
    companyName: '',
    tradeName: '',
    businessType: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  };

  ownerData: any = {
    countryCode: '+91',
    mobile: '',
    email: '',
    panNumber: '',
    website: ''
  };

  constructor(private auth: AuthService, private http: HttpClient) { }

  ngOnInit() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.userName = user?.name || 'User';

    if (user?.mobile) {
      this.ownerData.mobile = user.mobile;
    }
    if (user?.email) {
      this.ownerData.email = user.email;
    }

    const hasSetup = this.auth.getHasSetup();
    this.isNewUser = hasSetup !== true;
    this.isLoading = false;
  }

  checkGST(event: any) {
    let gstNumber = event.target.value.toUpperCase().trim();
    this.companyData.gstin = gstNumber;
    this.gstError = '';

    if (gstNumber.length === 15) {
      this.fetchGstDetails();
    }
  }

  fetchGstDetails() {
    const gstin = this.companyData.gstin;
    if (!gstin || gstin.length !== 15) {
      this.gstError = 'Please enter valid 15-digit GSTIN number';
      return;
    }

    this.isFetchingGst = true;
    this.gstError = '';

    this.http.get(`https://billsezy.com/Api/gst-fetch.php?gstin=${gstin}`).subscribe(
      (res: any) => {
        this.isFetchingGst = false;

        if (res?.status === true && res?.data) {
          const data = res.data;

          if (data.tradeNam) {
            this.companyData.companyName = data.tradeNam;
            this.companyData.tradeName = data.tradeNam;
          } else if (data.lgnm) {
            this.companyData.companyName = data.lgnm;
          }

          if (data.nba && data.nba.length > 0) {
            this.companyData.businessType = data.nba.join(', ');
          }

          if (data.pradr?.addr) {
            const addr = data.pradr.addr;
            let addressParts = [];
            if (addr.bno && addr.bno !== '-') addressParts.push(addr.bno);
            if (addr.bnm && addr.bnm !== '-') addressParts.push(addr.bnm);
            if (addr.st && addr.st !== '-') addressParts.push(addr.st);
            if (addr.loc && addr.loc !== '-') addressParts.push(addr.loc);

            this.companyData.address = addressParts.join(', ');
            this.companyData.city = addr.city || addr.loc || '';
            this.companyData.state = addr.stcd || '';
            this.companyData.pincode = addr.pncd || '';
          }

          this.gstError = '';
          alert('GST details fetched successfully!');
        } else {
          this.gstError = res?.message || "Invalid GST Number";
        }
      },
      (error: any) => {
        this.isFetchingGst = false;
        this.gstError = "Failed to fetch GST details";
      }
    );
  }

  panToUpperCase(event: any) {
    let pan = event.target.value.toUpperCase();
    this.ownerData.panNumber = pan;
    this.panError = '';

    if (pan.length === 10 && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
      this.panError = 'Invalid PAN format';
    }
  }

  startSetup() {
    this.step = 'step1';
    this.gstError = '';
    this.isFetchingGst = false;
  }

  nextStep() {
    if (this.validateStep1()) {
      this.step = 'step2';
    }
  }

  skipSetup() {
    if (this.hasAnyData()) {
      this.saveAllData();
    }
    this.goToDashboard();
  }

  completeSetup() {
    if (this.validateStep1() && this.validateStep2()) {
      this.saveAllData();
      this.goToDashboard();
    }
  }

  validateStep1(): boolean {
    if (!this.companyData.gstin) {
      alert('Please enter GSTIN Number');
      return false;
    }
    if (this.companyData.gstin.length !== 15) {
      alert('GSTIN should be 15 characters');
      return false;
    }
    if (!this.companyData.companyName) {
      alert('Please enter Company Name');
      return false;
    }
    if (!this.companyData.address) {
      alert('Please enter Address');
      return false;
    }
    if (!this.companyData.city) {
      alert('Please enter City');
      return false;
    }
    if (!this.companyData.state) {
      alert('Please enter State');
      return false;
    }
    if (!this.companyData.pincode) {
      alert('Please enter Pincode');
      return false;
    }
    return true;
  }

  validateStep2(): boolean {
    if (!this.ownerData.mobile) {
      alert('Please enter Phone Number');
      return false;
    }
    if (this.ownerData.mobile.length < 10) {
      alert('Please enter valid Phone Number (10 digits)');
      return false;
    }
    if (!this.ownerData.email) {
      alert('Please enter Email ID');
      return false;
    }
    if (!this.ownerData.panNumber) {
      alert('Please enter PAN Number');
      return false;
    }
    if (this.ownerData.panNumber.length !== 10) {
      alert('PAN Number should be 10 characters');
      return false;
    }
    return true;
  }

  hasAnyData(): boolean {
    return !!(this.companyData.gstin || this.companyData.companyName);
  }

  saveAllData() {
    const userId = this.auth.getUserId();
    
    const allData = {
      user_id: userId,
      gstin: this.companyData.gstin,
      company_name: this.companyData.companyName,
      trade_name: this.companyData.tradeName,
      business_type: this.companyData.businessType,
      address: this.companyData.address,
      city: this.companyData.city,
      state: this.companyData.state,
      pincode: this.companyData.pincode,
      phone: this.ownerData.countryCode + ' ' + this.ownerData.mobile,
      email: this.ownerData.email,
      pan: this.ownerData.panNumber,
      website: this.ownerData.website
    };

    this.isLoading = true;

    this.http.post('https://billsezy.com/Api/setup.php', allData).subscribe(
      (res: any) => {
        this.isLoading = false;
        console.log('Setup API Response:', res);

        if (res.status === true) {
          localStorage.setItem('companyInfo', JSON.stringify(allData));

          const user = JSON.parse(localStorage.getItem('user') || '{}');
          user.name = this.companyData.companyName;
          user.mobile = this.ownerData.mobile;
          user.email = this.ownerData.email;
          localStorage.setItem('user', JSON.stringify(user));

          this.auth.saveHasSetup(true);
          alert('Setup completed successfully!');
          this.goToDashboard();
        } else {
          alert(res.message || 'Setup failed');
        }
      },
      (error: any) => {
        this.isLoading = false;
        console.error('Setup API Error:', error);
        alert('Network error. Please try again.');
      }
    );
  }

  goToDashboard() {
    this.closeModal.emit();
  }
}