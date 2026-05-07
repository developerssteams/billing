import { Component, ViewChild } from '@angular/core';
import { MaterialModule } from '../../../material.module';
import {
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexLegend,
  ApexStroke,
  ApexTooltip,
  ApexAxisChartSeries,
  ApexPlotOptions,
  ApexResponsive,
  ApexGrid,
  ApexXAxis,
  ApexYAxis,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { MatButtonModule } from '@angular/material/button';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatIconModule } from '@angular/material/icon';

export interface CurrentVisitsChart {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  tooltip: ApexTooltip;
  stroke: ApexStroke;
  legend: ApexLegend;
  responsive: ApexResponsive;
  grid: ApexGrid;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  colors: string | any;
  labels: string | any;
}

@Component({
  selector: 'app-current-visits',
  imports: [MaterialModule, NgApexchartsModule, MatButtonModule, TablerIconsModule, MatIconModule],
  templateUrl: './current-visits.component.html',
})
export class AppCurrentVisitsComponent {
  @ViewChild('chart') chart: ChartComponent = Object.create(null);
  public CurrentVisitsChart!: Partial<CurrentVisitsChart> | any;

  constructor() {
    this.CurrentVisitsChart = {

      color: "#adb5bd",
      series: [1650, 350, 458],
      labels: ["America", "Asia", "Europe"],
      chart: {
        height: 205,
        type: "donut",
        fontFamily: "inherit",
        foreColor: "#adb0bb",
      },
      stroke: {
        show: false,
      },
      dataLabels: {
        enabled: false,
      },

      legend: {
        show: false,
      },
      colors: ["var(--mat-sys-primary)", "#F6B51E", "var(--mat-sys-secondary)"],

      plotOptions: {
        pie: {
          donut: {
            size: "80%",
            labels: {
              show: true,
              total: {
                show: true,
                label: "Total",
                formatter: function (w: { globals: { seriesTotals: any[]; }; }) {
                  return w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                }
              }
            }
          }
        }
      },

      tooltip: {
        theme: "dark",
        fillSeriesColor: false,
      },

    };
  }

}