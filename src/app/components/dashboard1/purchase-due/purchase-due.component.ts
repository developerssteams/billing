import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-purchase-due',
  standalone: true, // ✅ Add this - it's required for standalone component
  imports: [CommonModule, MatCardModule], // ✅ Add required imports
  templateUrl: './purchase-due.component.html',
  styleUrl: './purchase-due.component.scss',
})
export class PurchaseDueComponent {
  purchaseAmount = 1234;
  dueDate = '30 May 2026';
  progressPercentage = 65;
}