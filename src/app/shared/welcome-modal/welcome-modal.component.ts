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

  // COMPANY DATA

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

  // USER DATA

  userData: any = {

    userName: '',

    countryCode: '+91',

    mobile: '',

    email: '',

    pan: '',

    website: ''

  };

  constructor(
    private auth: AuthService,
    private http: HttpClient
  ) { }

  ngOnInit() {

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    this.userName = user?.name || 'User';

    this.userData.userName = user?.name || '';

    this.userData.mobile = user?.mobile || '';

    this.userData.email = user?.email || '';

    const hasSetup = Number(user?.has_setup || 0);

    this.isNewUser = hasSetup === 0;

    this.isLoading = false;

  }

  // GST CHECK

  checkGST(event: any) {

    let gstNumber = event.target.value.toUpperCase().trim();

    this.companyData.gstin = gstNumber;

    this.gstError = '';

    if (gstNumber.length === 15) {

      this.fetchGSTDetails(gstNumber);

    }

  }

  // MANUAL FETCH

  fetchGstDetailsManually() {

    if (
      this.companyData.gstin &&
      this.companyData.gstin.length === 15
    ) {

      this.fetchGSTDetails(this.companyData.gstin);

    } else {

      this.gstError = 'Please enter valid 15-digit GSTIN number';

    }

  }

  // GST FETCH API

  fetchGSTDetails(gstin: string) {

    this.gstLoading = true;

    this.gstError = '';

    this.http.get(
      `https://billsezy.com/Api/gst-fetch.php?gstin=${gstin}`
    ).subscribe(

      (res: any) => {

        this.gstLoading = false;

        if (res?.status === true && res?.data) {

          const data = res.data;

          console.log('GST DATA', data);

          // COMPANY NAME

          if (data.tradeNam) {

            this.companyData.companyName = data.tradeNam;

            this.companyData.tradeName = data.tradeNam;

          } else if (data.lgnm) {

            this.companyData.companyName = data.lgnm;

          }

          // ADDRESS

          if (data.pradr?.addr) {

            const addr = data.pradr.addr;

            let fullAddress = '';

            if (addr.bno) {
              fullAddress += addr.bno + ', ';
            }

            if (addr.flno) {
              fullAddress += addr.flno + ', ';
            }

            if (addr.st) {
              fullAddress += addr.st + ', ';
            }

            if (addr.loc) {
              fullAddress += addr.loc + ', ';
            }

            this.companyData.addressLine1 = fullAddress;

            // CITY

            if (addr.dst) {

              this.companyData.city = addr.dst;

            } else if (addr.loc) {

              this.companyData.city = addr.loc;

            }

            // STATE

            if (addr.stcd) {

              this.companyData.state = addr.stcd;

            }

            // PINCODE

            if (addr.pncd) {

              this.companyData.pincode = addr.pncd;

            }

          }

          // BUSINESS TYPE

          if (data.ctb) {

            this.companyData.businessType = data.ctb;

          } else if (data.dty) {

            this.companyData.businessType = data.dty;

          } else if (data.nba && data.nba.length > 0) {

            this.companyData.businessType =
              data.nba.join(', ');

          }

          this.gstError = '';

        } else {

          this.gstError =
            res?.message || 'Invalid GST Number';

        }

      },

      (error: any) => {

        this.gstLoading = false;

        this.gstError = 'Failed to fetch GST details';

        console.error(error);

      }

    );

  }

  // PAN UPPERCASE

  panToUpperCase(event: any) {

    this.userData.pan =
      event.target.value.toUpperCase();

  }

  // START SETUP

  startSetup() {

    this.step = 'step1';

    this.gstError = '';

    this.gstLoading = false;

  }

  // NEXT STEP

  nextStep() {

    if (this.validateStep1()) {

      this.step = 'step2';

    }

  }

  // PREVIOUS STEP

  prevStep() {

    this.step = 'step1';

  }

  // SKIP

  skipSetup() {

    if (this.hasAnyData()) {

      this.saveAllData();

    }

    this.goToDashboard();

  }

  // COMPLETE

  completeSetup() {

    if (
      this.validateStep1() &&
      this.validateStep2()
    ) {

      this.saveAllData();

      this.goToDashboard();

    }

  }

  // STEP 1 VALIDATION

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

      alert('Please enter Business Type');

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

  // STEP 2 VALIDATION

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

  // CHECK ANY DATA

  hasAnyData(): boolean {

    return !!(
      this.companyData.gstin ||
      this.companyData.companyName
    );

  }

  // SAVE DATA

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

      mobile:
        this.userData.countryCode +
        ' ' +
        this.userData.mobile,

      email: this.userData.email,

      pan: this.userData.pan,

      website: this.userData.website

    };

    // SAVE API

    this.http.post(
      'https://billsezy.com/Api/setup.php',
      allData
    ).subscribe(

      (res: any) => {

        console.log('Setup API Response:', res);

        if (res.status === true) {

          localStorage.setItem(
            'companyInfo',
            JSON.stringify(allData)
          );

          this.auth.saveHasSetup(true);

        }

      },

      (error) => {

        console.error('Setup API Error:', error);

      }

    );

    localStorage.setItem(
      'companyInfo',
      JSON.stringify(allData)
    );

    this.auth.saveHasSetup(true);

    console.log('All Data Saved:', allData);

  }

  // DASHBOARD

  goToDashboard() {

    this.closeModal.emit();

  }

}