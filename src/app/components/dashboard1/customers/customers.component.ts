import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { TablerIconsModule } from 'angular-tabler-icons';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, MatCardModule, TablerIconsModule],
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss']
})
export class CustomersComponent {
  @Input() value: number = 1248;
  @Input() newCustomers: number = 28;
  @Input() activeCustomers: number = 1156;
  @Input() returningRate: number = 68;
  @Input() growth: number = 12.5;
}