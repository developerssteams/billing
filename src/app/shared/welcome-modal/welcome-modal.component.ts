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

  companyData: any = {
    gstin: '',
    company_name: '',
    trade_name: '',
    business_type: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    countryCode: '+91',
    phone: '',
    email: '',
    pan: '',
    website: '',
    logo_preview: ''
  };

  ownerData: any = {
    owner_name: '',
    owner_mobile: '',
    owner_email: '',
    designation: '',
    signatory_name: '',
    signatory_preview: ''
  };

  constructor(private auth: AuthService, private http: HttpClient) { }

  ngOnInit() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.userName = user?.name || 'User';

    // Auto-fill from user data
    if (user?.mobile) {
      this.companyData.phone = user.mobile;
      this.ownerData.owner_mobile = user.mobile;
    }
    if (user?.email) {
      this.companyData.email = user.email;
      this.ownerData.owner_email = user.email;
    }

    const hasSetup = this.auth.getHasSetup();
    this.isNewUser = !hasSetup;
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
            this.companyData.company_name = data.tradeNam;
            this.companyData.trade_name = data.tradeNam;
          } else if (data.lgnm) {
            this.companyData.company_name = data.lgnm;
          }

          if (data.nba && data.nba.length > 0) {
            this.companyData.business_type = data.nba.join(', ');
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
    this.companyData.pan = event.target.value.toUpperCase();
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
    if (!this.companyData.company_name) {
      alert('Please enter Company Name');
      return false;
    }
    if (!this.companyData.business_type) {
      alert('Please enter Business Type');
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
    if (!this.companyData.phone) {
      alert('Please enter Phone Number');
      return false;
    }
    if (!this.companyData.email) {
      alert('Please enter Email');
      return false;
    }
    if (!this.companyData.pan) {
      alert('Please enter PAN Number');
      return false;
    }
    if (this.companyData.pan.length !== 10) {
      alert('PAN Number should be 10 characters');
      return false;
    }
    return true;
  }

  validateStep2(): boolean {
    if (!this.ownerData.owner_name) {
      alert('Please enter Owner Name');
      return false;
    }
    if (!this.ownerData.owner_mobile) {
      alert('Please enter Owner Mobile Number');
      return false;
    }
    if (!this.ownerData.owner_email) {
      alert('Please enter Owner Email ID');
      return false;
    }
    if (!this.ownerData.designation) {
      alert('Please enter Designation');
      return false;
    }
    if (!this.ownerData.signatory_name) {
      alert('Please enter Authorised Signatory Name');
      return false;
    }
    return true;
  }

  hasAnyData(): boolean {
    return !!(this.companyData.gstin || this.companyData.company_name);
  }

  saveAllData() {
    const userId = this.auth.getUserId();
    const allData = {
      user_id: userId,
      gstin: this.companyData.gstin,
      company_name: this.companyData.company_name,
      trade_name: this.companyData.trade_name,
      business_type: this.companyData.business_type,
      address: this.companyData.address,
      city: this.companyData.city,
      state: this.companyData.state,
      pincode: this.companyData.pincode,
      phone: this.companyData.countryCode + ' ' + this.companyData.phone,
      email: this.companyData.email,
      pan: this.companyData.pan,
      website: this.companyData.website,
      user_name: this.ownerData.owner_name,
      mobile: this.ownerData.owner_mobile,
      owner_email: this.ownerData.owner_email,
      designation: this.ownerData.designation,
      signatory_name: this.ownerData.signatory_name,
      signatory_image: this.ownerData.signatory_preview || '',
      logo: this.companyData.logo_preview || ''
    };

    this.isLoading = true;

    this.http.post('https://billsezy.com/Api/setup.php', allData).subscribe(
      (res: any) => {
        this.isLoading = false;

        if (res.status === true) {
          localStorage.setItem('companyInfo', JSON.stringify(allData));

          const user = JSON.parse(localStorage.getItem('user') || '{}');
          user.name = this.ownerData.owner_name;
          user.mobile = this.ownerData.owner_mobile;
          user.email = this.ownerData.owner_email;
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
        alert('Network error. Please try again.');
      }
    );
  }

  onLogoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.companyData.logo_preview = e.target.result;
        this.companyData.logo = file;
      };
      reader.readAsDataURL(file);
    }
  }

  removeLogo(event: any) {
    event.stopPropagation();
    this.companyData.logo_preview = '';
    this.companyData.logo = null;
  }

  onSignatorySelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.ownerData.signatory_preview = e.target.result;
        this.ownerData.signatory_image = file;
      };
      reader.readAsDataURL(file);
    }
  }

  removeSignatory(event: any) {
    event.stopPropagation();
    this.ownerData.signatory_preview = '';
    this.ownerData.signatory_image = null;
  }

  goToDashboard() {
    this.closeModal.emit();
  }
}