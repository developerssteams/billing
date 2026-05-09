import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from 'src/app/services/auth.service';  // ✅ Import AuthService

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {

  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('signatureInput') signatureInput!: ElementRef;

  constructor(
    private http: HttpClient,
    private authService: AuthService  // ✅ Inject AuthService
  ) { }

  logoPreview: string | ArrayBuffer | null = null;
  signaturePreview: string | ArrayBuffer | null = null;

  selectedFile: any;
  selectedSignature: any;
  isLoading: boolean = false;
  gstLoading: boolean = false;
  gstError: string = '';

  // 🔥 Get user from AuthService
  get user(): any {
    return this.authService.getUser() || {};
  }

  // 🔥 Get user_id dynamically
  get userId(): number {
    const userId = this.authService.getUserId();
    return userId || 1;
  }

  companyId: number | null = null;

  // COMPANY DATA
  company: any = {
    id: null,
    user_id: null,
    company_name: '',
    trade_name: '',
    business_type: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstin: '',
    phone: '',
    email: '',
    pan: '',
    website: '',
    country_code: '+91',
    logo: '',
    signature: ''
  };

  ngOnInit() {
    console.log("Current User ID from AuthService:", this.userId);
    console.log("User from AuthService:", this.user);
    
    if (this.userId) {
      this.company.user_id = this.userId;
      this.getCompanyDetails();
    }
  }

  /* ================= GET COMPANY DETAILS ================= */
  getCompanyDetails() {
    this.isLoading = true;
    const userId = this.userId;

    console.log("Fetching company details for user_id:", userId);

    this.http.get(`https://billsezy.com/Api/get_company_details.php?user_id=${userId}`)
      .subscribe({
        next: (res: any) => {
          this.isLoading = false;
          console.log("Company Details Response:", res);

          if (res.status && res.data) {
            const data = res.data;

            this.company = {
              id: data.id || null,
              user_id: data.user_id || this.userId,
              company_name: data.company_name || '',
              trade_name: data.trade_name || '',
              business_type: data.business_type || '',
              address: data.address || '',
              city: data.city || '',
              state: data.state || '',
              pincode: data.pincode || '',
              gstin: data.gstin || '',
              phone: data.phone || '',
              email: data.email || '',
              pan: data.pan || '',
              website: data.website || '',
              country_code: data.country_code || '+91',
              logo: data.logo || '',
              signature: data.signature || ''
            };
            
            // Set logo preview
            if (this.company.logo && this.company.logo !== 'null') {
              this.logoPreview = this.company.logo;
            }

            // Set signature preview
            if (this.company.signature && this.company.signature !== 'null') {
              this.signaturePreview = this.company.signature;
            }
          } else {
            console.log("No company data found for user:", userId);
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error fetching company:', err);
        }
      });
  }

  /* ================= SIGNATURE UPLOAD ================= */
  onSignatureChange(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
    }
    
    this.selectedSignature = file;
    
    const reader = new FileReader();
    reader.onload = () => {
        this.signaturePreview = reader.result;
    };
    reader.readAsDataURL(file);
  }

  /* ================= SYNC TRADE NAME TO COMPANY NAME ================= */
  syncCompanyName() {
    if (!this.company.company_name) {
      this.company.company_name = this.company.trade_name;
    }
  }

  /* ================= LOGO UPLOAD ================= */
  onFileChange(event: any) {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.logoPreview = reader.result;
    };
    reader.readAsDataURL(file);
  }

  /* ================= FETCH GST DETAILS ================= */
  fetchGSTDetails(gstin: string) {
    if (!gstin || gstin.length !== 15) {
      this.gstError = "Enter valid 15 digit GSTIN";
      return;
    }

    this.gstLoading = true;
    this.gstError = '';

    this.http.get(`https://billsezy.com/Api/gst-fetch.php?gstin=${gstin}`).subscribe(
      (res: any) => {
        console.log("GST RESPONSE:", res);
        this.gstLoading = false;

        if (res?.status && res?.data) {
          const data = res.data;

          if (data.tradeNam) {
            this.company.trade_name = data.tradeNam;
            this.company.company_name = data.tradeNam;
          } else if (data.lgnm) {
            this.company.trade_name = data.lgnm;
            this.company.company_name = data.lgnm;
          }

          if (data.pradr?.addr) {
            const addr = data.pradr.addr;

            let fullAddress = '';
            if (addr.bno) fullAddress += addr.bno + ', ';
            if (addr.flno) fullAddress += addr.flno + ', ';
            if (addr.bn) fullAddress += addr.bn + ', ';
            if (addr.st) fullAddress += addr.st + ', ';
            if (addr.loc) fullAddress += addr.loc + ', ';
            if (addr.dst) fullAddress += addr.dst;

            fullAddress = fullAddress.replace(/,\s*$/, '').trim();
            this.company.address = fullAddress;
            this.company.city = addr.dst || addr.loc || '';
            this.company.state = addr.stcd || '';
            this.company.pincode = addr.pncd || '';
          }

          if (data.ctb) {
            this.company.business_type = data.ctb;
          } else if (data.nba && data.nba.length > 0) {
            this.company.business_type = data.nba.join(', ');
          }

          this.gstError = '';
          alert('GST details fetched successfully!');
        } else {
          this.gstError = res?.message || 'Invalid GST Number';
        }
      },
      (error: any) => {
        this.gstLoading = false;
        this.gstError = 'Failed to fetch GST details';
        console.error(error);
      }
    );
  }

  /* ================= SAVE COMPANY ================= */
  saveCompany() {
    const userId = this.userId;

    if (!userId) {
      alert("User not logged in");
      return;
    }

    // VALIDATION
    if (!this.company.trade_name) {
      alert('Trade/Brand Name is required');
      return;
    }

    if (!this.company.company_name) {
      alert('Company Name is required');
      return;
    }

    if (!this.company.phone) {
      alert('Company Phone is required');
      return;
    }

    if (!this.company.email) {
      alert('Company Email is required');
      return;
    }

    if (!this.company.gstin) {
      alert('GSTIN is required');
      return;
    }

    if (!this.company.pan) {
      alert('PAN Number is required');
      return;
    }

    this.isLoading = true;

    // FORM DATA
    const formData = new FormData();

    formData.append('user_id', userId.toString());

    if (this.company.id) {
      formData.append('id', this.company.id.toString());
    }

    formData.append('trade_name', this.company.trade_name);
    formData.append('company_name', this.company.company_name);
    formData.append('business_type', this.company.business_type);
    formData.append('address', this.company.address);
    formData.append('city', this.company.city);
    formData.append('state', this.company.state);
    formData.append('pincode', this.company.pincode);
    formData.append('gstin', this.company.gstin);
    formData.append('phone', this.company.phone);
    formData.append('email', this.company.email);
    formData.append('pan', this.company.pan);
    formData.append('website', this.company.website);
    formData.append('country_code', this.company.country_code);

    // CLEAN COMPANY NAME FOR FILE NAMES
    const cleanName = this.company.company_name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');

    // LOGO UPLOAD
    if (this.selectedFile) {
      const logoExt = this.selectedFile.name.split('.').pop();
      const logoFileName = `${cleanName}_logo.${logoExt}`;
      formData.append('logo', this.selectedFile, logoFileName);
    }

    // SIGNATURE UPLOAD
    if (this.selectedSignature) {
      const signExt = this.selectedSignature.name.split('.').pop();
      const signFileName = `${cleanName}_sign.${signExt}`;
      formData.append('signature', this.selectedSignature, signFileName);
    }

    // API CALL
    this.http.post('https://billsezy.com/Api/save_company_details.php', formData)
      .subscribe({
        next: (res: any) => {
          this.isLoading = false;
          console.log("Save Response:", res);

          if (res.status) {
            alert(res.message);
            this.getCompanyDetails();  // Refresh data
            this.selectedFile = null;   // Clear selected file
            this.selectedSignature = null;  // Clear selected signature
            
            // Clear file input
            if (this.fileInput) {
              this.fileInput.nativeElement.value = '';
            }
            if (this.signatureInput) {
              this.signatureInput.nativeElement.value = '';
            }
          } else {
            alert(res.message || 'Save failed');
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.log("Save Error:", error);
          alert(error?.error?.message || "Server Error ❌");
        }
      });
  }
}