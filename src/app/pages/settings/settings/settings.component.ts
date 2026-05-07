import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {

  @ViewChild('fileInput') fileInput!: ElementRef;

  constructor(private http: HttpClient) { }

  /* ================= LOGO ================= */
  logoPreview: string | ArrayBuffer | null = null;
  selectedFile: any;
  isLoading: boolean = false;
  
  // Company details with user_id
  user: any = JSON.parse(localStorage.getItem('user') || '{}');
  companyId: number | null = null;

  company: any = {
    id: null,
    user_id: null,
    gstin: '',
    trade_name: '',
    company_name: '',
    country_code: '+91',
    phone: '',
    email: '',
    address_line1: '',
    address_line2: '',
    address: '', // Combined address field
    city: '',
    pincode: '',
    state: '',
    website: '',
    pan: '',
    business_type: '',
    logo: ''
  };

  ngOnInit() {
    console.log("USER ID:", this.user?.id);
    console.log("USER INFO:", this.user);
    
    if (this.user?.id) {
      this.getCompanyDetails();
    }
  }

  /* ================= GET COMPANY DETAILS ================= */
  getCompanyDetails() {
    this.isLoading = true;
    const userId = this.user.id;

    this.http.get(`https://billsezy.com/Api/get_company_details.php?user_id=${userId}`)
      .subscribe({
        next: (res: any) => {
          this.isLoading = false;
          
          if (res.status && res.data) {
            const data = res.data;
            
            // Combine address_line1 and address_line2
            const fullAddress = this.combineAddress(data.address_line1, data.address_line2);
            
            this.company = {
              id: data.id || null,
              user_id: data.user_id || this.user.id,
              trade_name: data.trade_name || '',
              company_name: data.company_name || '',
              country_code: data.country_code || '+91',
              phone: data.phone || '',
              email: data.email || '',
              gstin: data.gstin || '',
              address_line1: data.address_line1 || '',
              address_line2: data.address_line2 || '',
              address: fullAddress,
              city: data.city || '',
              pincode: data.pincode || '',
              state: data.state || '',
              website: data.website || '',
              pan: data.pan || '',
              business_type: data.business_type || '',
              logo: data.logo || ''
            };
            
            // Set logo preview if exists
            if (this.company.logo) {
              this.logoPreview = 'http://localhost/uploads/' + this.company.logo;
            }
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error fetching company:', err);
        }
      });
  }

  /* ================= COMBINE ADDRESS ================= */
  combineAddress(address1: string, address2: string): string {
    let combined = '';
    if (address1 && address1.trim()) {
      combined += address1.trim();
    }
    if (address2 && address2.trim()) {
      combined += (combined ? ' ' : '') + address2.trim();
    }
    return combined;
  }

  /* ================= SPLIT ADDRESS ================= */
  splitAddress(address: string): { line1: string, line2: string } {
    if (!address || !address.trim()) {
      return { line1: '', line2: '' };
    }
    
    // Try to split by comma and space
    const parts = address.split(', ');
    if (parts.length >= 2) {
      return { 
        line1: parts[0], 
        line2: parts.slice(1).join(', ') 
      };
    }
    
    // Try to split by comma only
    const parts2 = address.split(',');
    if (parts2.length >= 2) {
      return { 
        line1: parts2[0], 
        line2: parts2.slice(1).join(',').trim() 
      };
    }
    
    return { line1: address, line2: '' };
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

  /* ================= GST FETCH ================= */
  gstLoading: boolean = false;
  gstError: string = '';

  syncCompanyName() {
    this.company.company_name = this.company.trade_name;
  }

  fetchGSTDetails(gstin: string) {
    if (!gstin || gstin.length !== 15) {
      this.gstError = "Enter valid 15 digit GSTIN";
      return;
    }

    this.gstLoading = true;
    this.gstError = '';

    this.http.get(`https://billsezy.com/Api/gst-fetch.php?gstin=${gstin}`)
      .subscribe(
        (res: any) => {
          console.log("GST RESPONSE:", res);
          this.gstLoading = false;

          if (res?.status && res?.data) {
            const data = res.data;

            // Trade + Company same
            this.company.trade_name = data.tradeNam || data.lgnm || '';
            this.company.company_name = this.company.trade_name;

            // Get address components from GST data
            const bno = data.pradr?.addr?.bno || '';
            const st = data.pradr?.addr?.st || '';
            const loc = data.pradr?.addr?.loc || '';
            const city = data.pradr?.addr?.city || loc || '';
            const pincode = data.pradr?.addr?.pncd || '';
            const state = data.pradr?.addr?.stcd || '';
            
            // Set address line 1 and line 2 separately
            this.company.address_line1 = bno;
            this.company.address_line2 = st;
            
            // Combine into single address field
            this.company.address = this.combineAddress(bno, st);
            
            // Set other address fields
            this.company.city = city;
            this.company.pincode = pincode;
            this.company.state = state;

            // Business Type AUTO
            this.company.business_type = data.nba ? data.nba.join(', ') : '';

            // Show success message
            alert('GST details fetched successfully!');

          } else {
            this.gstError = "No data found for this GSTIN";
          }
        },
        (error: any) => {
          this.gstLoading = false;
          this.gstError = "GST fetch failed";
          console.log(error);
        }
      );
  }

  /* ================= SAVE COMPANY ================= */
  saveCompany() {
    const userId = this.user?.id;

    if (!userId) {
      alert("User not logged in");
      return;
    }

    // Validation
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

    // Split address back into line1 and line2
    const addressParts = this.splitAddress(this.company.address);
    
    const formData = new FormData();
    formData.append('user_id', userId.toString());
    
    if (this.company.id) {
      formData.append('id', this.company.id.toString());
    }
    
    formData.append('trade_name', this.company.trade_name);
    formData.append('company_name', this.company.company_name);
    formData.append('country_code', this.company.country_code);
    formData.append('phone', this.company.phone);
    formData.append('email', this.company.email);
    formData.append('gstin', this.company.gstin);
    formData.append('address_line1', addressParts.line1);
    formData.append('address_line2', addressParts.line2);
    formData.append('city', this.company.city);
    formData.append('pincode', this.company.pincode);
    formData.append('state', this.company.state);
    formData.append('website', this.company.website);
    formData.append('pan', this.company.pan);
    formData.append('business_type', this.company.business_type);
    
    if (this.selectedFile) {
      formData.append('logo', this.selectedFile);
    }

    this.http.post('https://billsezy.com/Api/company-detail.php', formData)
      .subscribe({
        next: (res: any) => {
          this.isLoading = false;
          console.log(res);
          
          if (res.status) {
            alert(res.message);
            this.getCompanyDetails(); // Refresh data
          } else {
            alert(res.message || 'Save failed');
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.log(error);
          alert("Save failed: Server Error ❌");
        }
      });
  }
}