import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-eway-bills',
  standalone: true,
  imports: [PageHeaderComponent, CommonModule],
  templateUrl: './eway-bills.component.html',
  styleUrl: './eway-bills.component.scss',
})
export class EwayBillsComponent {

  // Table data for E-Way Bill conditions
  ewayConditions = [
    {
      id: 1,
      scenario: ' Goods Movement',
      condition: 'Consignment value exceeds ₹50,000',
      applicability: 'mandatory'
    },
    {
      id: 2,
      scenario: ' Interstate Transport',
      condition: 'Movement of goods between different states',
      applicability: 'mandatory'
    },
    {
      id: 3,
      scenario: ' Intrastate Transport',
      condition: 'Movement within same state (value > ₹50,000)',
      applicability: 'mandatory'
    },
    {
      id: 4,
      scenario: 'Supply of Goods',
      condition: 'Sale, transfer, or exchange of goods',
      applicability: 'mandatory'
    },
    {
      id: 5,
      scenario: ' Return of Goods',
      condition: 'Customer returns or rejections',
      applicability: 'mandatory'
    },
    {
      id: 6,
      scenario: ' Job Work',
      condition: 'Sending goods for processing or repair',
      applicability: 'mandatory'
    },
    {
      id: 7,
      scenario: ' Export/Import',
      condition: 'Movement to/from customs warehouse',
      applicability: 'mandatory'
    },
    {
      id: 8,
      scenario: 'Transporter Movement',
      condition: 'Goods transported by any registered transporter',
      applicability: 'mandatory'
    },
  ];

  constructor() { }

  // Open GST E-Way Bill Portal
  openGSTPortal() {
    const portalUrl = 'https://ewaybillgst.gov.in/';
    window.open(portalUrl, '_blank');
    console.log('Redirecting to GST E-Way Bill Portal');
  }

  // Get badge class based on applicability
  getBadgeClass(applicability: string): string {
    switch(applicability) {
      case 'mandatory':
        return 'badge mandatory';
      case 'optional':
        return 'badge optional';
      case 'exempted':
        return 'badge exempted';
      default:
        return 'badge';
    }
  }

  // Get badge text
  getBadgeText(applicability: string): string {
    switch(applicability) {
      case 'mandatory':
        return 'Mandatory';
      case 'optional':
        return 'Not Required';
      case 'exempted':
        return 'Exempted';
      default:
        return '';
    }
  }

  // Open help guide
  openHelpGuide() {
    const helpMessage = `📚 E-Way Bill Help Guide\n\n` +
      `1. E-Way Bill is valid for 1 day per 100 km\n` +
      `2. Generate before goods movement starts\n` +
      `3. Can be modified within 24 hours\n` +
      `4. Keep a physical or digital copy during transit\n\n` +
      `For more assistance, contact support.`;
    
    alert(helpMessage);
  }

  // Open contact support
  openContactSupport() {
    const supportMessage = `📞 Customer Support\n\n` +
      `Email: support@example.com\n` +
      `Phone: +91-9876543210\n` +
      `Timing: 9 AM - 6 PM (Mon-Fri)\n\n` +
      `For GST Portal issues, visit: https://ewaybillgst.gov.in`;
    
    alert(supportMessage);
  }
}