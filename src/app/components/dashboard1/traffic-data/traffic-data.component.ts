import { Component, ViewChild } from '@angular/core';
import { MaterialModule } from '../../../material.module';
import { RouterModule } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

export interface TrafficData {
  source: string;
  visits: number;
  bounceRate: string;
  goal: number;
  color: string;
}

const ELEMENT_DATA: TrafficData[] = [
  { source: 'Direct', visits: 1300, bounceRate: '30%', goal: 80, color: 'warning' },
  { source: 'Email Campaign', visits: 5000, bounceRate: '45%', goal: 40, color: 'secondary' },
  { source: 'Organic', visits: 3000, bounceRate: '10%', goal: 55, color: 'primary' },
  { source: 'Referral', visits: 2000, bounceRate: '80%', goal: 20, color: 'error' },
  { source: 'Session', visits: 2500, bounceRate: '25%', goal: 70, color: 'info' },
];

@Component({
  selector: 'app-traffic-data',
  imports: [MaterialModule, RouterModule],
  templateUrl: './traffic-data.component.html',
})
export class AppTrafficDataComponent {
  displayedColumns: string[] = ['select', 'source', 'visits', 'bounceRate', 'goal'];
  dataSource = new MatTableDataSource<TrafficData>(ELEMENT_DATA);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;
  }
}
