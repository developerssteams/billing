import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';

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

  // Company Data (Updated)
  companyData: any = {
    gstin: '',
    companyName: '',
    tradeName: '',
    businessType: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    logo: null,
    logoPreview: ''
  };

  // Owner Data (Updated)
  ownerData: any = {
    userName: '',
    mobile: '',
    email: '',
    pan: '',
    website: ''
  };

  constructor(private auth: AuthService) { }

  ngOnInit() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.userName = user?.name || 'User';

    // Auto-fill contact and email from user data
    if (user?.mobile) {
      this.ownerData.mobile = user.mobile;
    }
    if (user?.email) {
      this.ownerData.email = user.email;
    }

    const hasSetup = Number(user?.has_setup || 0);
    this.isNewUser = hasSetup === 0;
    this.isLoading = false;
  }

  // 🔥 FETCH GST DETAILS FROM API (Auto-fetch on blur)
  async fetchGstDetails() {
    const gstin = this.companyData.gstin;

    if (!gstin || gstin.length !== 15) {
      // Don't alert, just return - user might be entering manually
      return;
    }

    this.isFetchingGst = true;

    try {
      // FREE GST API
      const response = await fetch(`https://api.gstins.in/verify?gstin=${gstin}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('GST API Response:', data);

        // Auto-fill company details from GST response
        if (data.tradeName || data.businessName) {
          this.companyData.companyName = data.tradeName || data.businessName || this.companyData.companyName;
          this.companyData.tradeName = data.tradeName || '';
        }

        if (data.address) {
          const addr = data.address;
          this.companyData.address = `${addr.buildingName || ''} ${addr.street || ''}`.trim();
          this.companyData.city = addr.city || '';
          this.companyData.state = addr.state || '';
          this.companyData.pincode = addr.pincode || '';
        }
      }
    } catch (error) {
      console.error('GST API Error:', error);
      // Silent fail - user can enter manually
    } finally {
      this.isFetchingGst = false;
    }
  }

  startSetup() {
    this.step = 'step1';
  }

  nextStep() {
    if (this.validateStep1()) {
      this.step = 'step2';
    }
  }

  skipSetup() {
    if (this.hasStep1Data()) {
      this.saveCompanyData();
    }
    this.goToDashboard();
  }

  completeSetup() {
    if (this.validateStep2()) {
      this.saveCompanyData();
      this.saveOwnerData();
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
    if (!this.ownerData.userName) {
      alert('Please enter User Name');
      return false;
    }
    if (!this.ownerData.mobile) {
      alert('Please enter Mobile Number');
      return false;
    }
    if (!this.ownerData.email) {
      alert('Please enter Email ID');
      return false;
    }
    return true;
  }

  hasStep1Data(): boolean {
    return !!(this.companyData.gstin || this.companyData.companyName ||
              this.companyData.address || this.companyData.city || this.companyData.state);
  }

  saveCompanyData() {
    const userId = this.auth.getUserId();
    const companyInfo = {
      user_id: userId,
      gstin: this.companyData.gstin,
      company_name: this.companyData.companyName,
      trade_name: this.companyData.tradeName,
      business_type: this.companyData.businessType,
      address: this.companyData.address,
      city: this.companyData.city,
      state: this.companyData.state,
      pincode: this.companyData.pincode,
      phone: this.ownerData.mobile,
      email: this.ownerData.email,
      pan: this.ownerData.pan,
      website: this.ownerData.website,
      logo: this.companyData.logoPreview || ''
    };

    localStorage.setItem('companyInfo', JSON.stringify(companyInfo));
    console.log('Company Data Saved:', companyInfo);

    // Send to backend API
    this.auth.saveCompanyDetails(companyInfo).subscribe({
      next: (res: any) => {
        console.log('Company details saved to DB:', res);
      },
      error: (err) => console.error('Error saving company details:', err)
    });
  }

  saveOwnerData() {
    const userId = this.auth.getUserId();
    const ownerInfo = {
      user_id: userId,
      user_name: this.ownerData.userName,
      mobile: this.ownerData.mobile,
      email: this.ownerData.email,
      pan: this.ownerData.pan,
      website: this.ownerData.website
    };

    localStorage.setItem('ownerInfo', JSON.stringify(ownerInfo));
    localStorage.setItem('setupCompleted', 'true');
    this.auth.saveHasSetup(true);
    console.log('Owner Data Saved:', ownerInfo);
  }

  onLogoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.companyData.logoPreview = e.target.result;
        this.companyData.logo = file;
      };
      reader.readAsDataURL(file);
    }
  }

  removeLogo(event: any) {
    event.stopPropagation();
    this.companyData.logoPreview = '';
    this.companyData.logo = null;
  }

  goToDashboard() {
    this.closeModal.emit();
  }

  close() {
    this.closeModal.emit();
  }
}