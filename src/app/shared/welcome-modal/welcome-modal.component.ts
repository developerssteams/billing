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
  gstLoading: boolean = false;
  gstError: string = '';
  
  companyData: any = {
    gstin: '',
    companyName: '',
    tradeName: '',
    businessType: '',
    addressLine1: '',
    city: '',
    state: '',
    pincode: ''
  };
  
  userData: any = {
    userName: '',
    countryCode: '+91',
    mobile: '',
    email: '',
    pan: '',
    website: ''
  };

  constructor(private auth: AuthService, private http: HttpClient) {}

  ngOnInit() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.userName = user?.name || 'User';
    
    this.userData.userName = user?.name || '';
    this.userData.mobile = user?.mobile || '';
    this.userData.email = user?.email || '';
    
    const hasSetup = this.auth.getHasSetup();
    this.isNewUser = hasSetup !== true;
    this.isLoading = false;
  }

  checkGST(event: any) {
    let gstNumber = event.target.value.toUpperCase().trim();
    this.companyData.gstin = gstNumber;
    this.gstError = '';

    if (gstNumber.length === 15) {
      this.fetchGSTDetails(gstNumber);
    }
  }

  fetchGstDetailsManually() {
    if (this.companyData.gstin && this.companyData.gstin.length === 15) {
      this.fetchGSTDetails(this.companyData.gstin);
    } else {
      this.gstError = 'Please enter valid 15-digit GSTIN number';
    }
  }

  fetchGSTDetails(gstin: string) {
    this.gstLoading = true;
    this.gstError = '';

    this.http.get(`https://billsezy.com/Api/gst-fetch.php?gstin=${gstin}`).subscribe(
      (res: any) => {
        this.gstLoading = false;

        if (res?.status === true && res?.data) {
          const data = res.data;
          
          if (data.tradeNam) {
            this.companyData.companyName = data.tradeNam;
            this.companyData.tradeName = data.tradeNam;
          } else if (data.lgnm) {
            this.companyData.companyName = data.lgnm;
          }
          
          if (data.pradr?.addr) {
            const addr = data.pradr.addr;
            if (addr.bno) this.companyData.addressLine1 = addr.bno;
            if (addr.city) this.companyData.city = addr.city;
            if (addr.stcd) this.companyData.state = addr.stcd;
            if (addr.pncd) this.companyData.pincode = addr.pncd;
          }
          
          if (data.businessType) {
            this.companyData.businessType = data.businessType;
          }
          
          this.gstError = '';
        } else {
          this.gstError = res?.message || "Invalid GST Number";
        }
      },
      (error: any) => {
        this.gstLoading = false;
        this.gstError = "Failed to fetch GST details";
      }
    );
  }

  panToUpperCase(event: any) {
    this.userData.pan = event.target.value.toUpperCase();
  }

  startSetup() {
    this.step = 'step1';
    this.gstError = '';
    this.gstLoading = false;
  }

  nextStep() {
    if (this.validateStep1()) {
      this.step = 'step2';
    }
  }

  prevStep() {
    this.step = 'step1';
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
    if (!this.companyData.companyName) {
      alert('Please enter Company Name');
      return false;
    }
    if (!this.companyData.businessType) {
      alert('Please select Business Type');
      return false;
    }
    if (!this.companyData.addressLine1) {
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
    if (!this.userData.userName) {
      alert('Please enter User Name');
      return false;
    }
    if (!this.userData.mobile) {
      alert('Please enter Mobile Number');
      return false;
    }
    if (!this.userData.email) {
      alert('Please enter Email Address');
      return false;
    }
    if (!this.userData.pan) {
      alert('Please enter PAN Number');
      return false;
    }
    if (this.userData.pan.length !== 10) {
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
      address_line1: this.companyData.addressLine1,
      city: this.companyData.city,
      state: this.companyData.state,
      pincode: this.companyData.pincode,
      user_name: this.userData.userName,
      mobile: this.userData.countryCode + ' ' + this.userData.mobile,
      email: this.userData.email,
      pan: this.userData.pan,
      website: this.userData.website
    };
    
    this.http.post('https://billsezy.com/Api/setup.php', allData).subscribe(
      (res: any) => {
        console.log('Setup API Response:', res);
        if (res.status === true) {
          localStorage.setItem('companyInfo', JSON.stringify(allData));
          this.auth.saveHasSetup(true);
        }
      },
      (error) => {
        console.error('Setup API Error:', error);
      }
    );
    
    localStorage.setItem('companyInfo', JSON.stringify(allData));
    this.auth.saveHasSetup(true);
    console.log('All Data Saved:', allData);
  }

  goToDashboard() {
    this.closeModal.emit();
  }
}