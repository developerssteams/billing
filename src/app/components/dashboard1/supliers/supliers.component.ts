import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { TablerIconsModule } from 'angular-tabler-icons';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, MatCardModule, TablerIconsModule],
  templateUrl: './supliers.component.html',
  styleUrls: ['./supliers.component.scss']
})
export class SuppliersComponent {
  @Input() value: number = 86;
  @Input() activeSuppliers: number = 72;
  @Input() newSuppliers: number = 4;
  @Input() totalSpent: number = 245000;
  @Input() averageRating: number = 4.5;
}