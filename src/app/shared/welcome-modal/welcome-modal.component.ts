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

  // Company Data
  companyData: any = {
    gstin: '',
    companyName: '',
    address: '',
    contactNumber: '',
    email: '',
    logo: null,
    logoPreview: ''
  };

  // Owner Data
  ownerData: any = {
    ownerName: '',
    mobile: '',
    email: '',
    designation: '',
    authorisedSignatory: ''
  };

  constructor(private auth: AuthService) { }

  ngOnInit() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.userName = user?.name || 'User';

    // Auto-fill contact and email from user data
    if (user?.mobile) {
      this.companyData.contactNumber = user.mobile;
      this.ownerData.mobile = user.mobile;
    }
    if (user?.email) {
      this.companyData.email = user.email;
      this.ownerData.email = user.email;
    }

    const hasSetup = Number(user?.has_setup || 0);

    // Agar has_setup = 1 hai to old user
    // Agar has_setup = 0 hai to new user
    this.isNewUser = hasSetup === 0;
    this.isLoading = false;
  }

  // 🔥 FETCH GST DETAILS FROM API
  async fetchGstDetails() {
    const gstin = this.companyData.gstin;

    if (!gstin || gstin.length !== 15) {
      alert('Please enter valid 15-digit GSTIN number');
      return;
    }

    this.isFetchingGst = true;

    try {
      // FREE GST API (Replace with your actual API)
      const response = await fetch(`https://api.gstins.in/verify?gstin=${gstin}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Alternative FREE API: https://gst-verify-api.vercel.app/api/verify?gstin=...
      // const response = await fetch(`https://gst-verify-api.vercel.app/api/verify?gstin=${gstin}`);

      if (response.ok) {
        const data = await response.json();
        console.log('GST API Response:', data);

        // Auto-fill company details from GST response
        if (data.tradeName || data.businessName) {
          this.companyData.companyName = data.tradeName || data.businessName || this.companyData.companyName;
        }

        if (data.address) {
          const addr = data.address;
          this.companyData.address = `${addr.buildingName || ''} ${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}`;
        }

        alert('GST details fetched successfully!');
      } else {
        // Manual entry fallback
        alert('Could not fetch GST details. Please enter manually.');
      }
    } catch (error) {
      console.error('GST API Error:', error);
      alert('Unable to fetch GST details. Please enter manually or check your GSTIN.');
    } finally {
      this.isFetchingGst = false;
    }
  }

  startSetup() {
    this.step = 'step1';
  }

  nextStep() {
    if (this.validateStep1()) {
      this.saveCompanyData();
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
    if (!this.companyData.address) {
      alert('Please enter Address');
      return false;
    }
    if (!this.companyData.contactNumber) {
      alert('Please enter Contact Number');
      return false;
    }
    if (!this.companyData.email) {
      alert('Please enter Email');
      return false;
    }
    return true;
  }

  validateStep2(): boolean {
    if (!this.ownerData.ownerName) {
      alert('Please enter Owner Name');
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
    if (!this.ownerData.designation) {
      alert('Please enter Designation');
      return false;
    }
    if (!this.ownerData.authorisedSignatory) {
      alert('Please enter Authorised Signatory');
      return false;
    }
    return true;
  }

  hasStep1Data(): boolean {
    return !!(this.companyData.gstin || this.companyData.companyName ||
      this.companyData.address || this.companyData.contactNumber ||
      this.companyData.email);
  }

  saveCompanyData() {
    const userId = this.auth.getUserId();
    const companyInfo = {
      user_id: userId,
      gstin: this.companyData.gstin,
      companyName: this.companyData.companyName,
      address: this.companyData.address,
      contactNumber: this.companyData.contactNumber,
      email: this.companyData.email,
      logo: this.companyData.logoPreview || ''
    };

    localStorage.setItem('companyInfo', JSON.stringify(companyInfo));
    console.log('Company Data Saved:', companyInfo);
  }

  saveOwnerData() {
    const userId = this.auth.getUserId();
    const ownerInfo = {
      user_id: userId,
      ownerName: this.ownerData.ownerName,
      mobile: this.ownerData.mobile,
      email: this.ownerData.email,
      designation: this.ownerData.designation,
      authorisedSignatory: this.ownerData.authorisedSignatory
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