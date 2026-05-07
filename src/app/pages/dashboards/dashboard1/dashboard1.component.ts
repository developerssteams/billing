import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { TablerIconsModule } from 'angular-tabler-icons';

import { AppAdCampaignClicksComponent } from 'src/app/components/dashboard1/ad-campaign-clicks/ad-campaign-clicks.component';
import { AppCampaignPerformanceComponent } from 'src/app/components/dashboard1/campaign-performance/campaign-performance.component';
import { AppConversionRateComponent } from 'src/app/components/dashboard1/conversion-rate/conversion-rate.component';
import { AppCurrentVisitsComponent } from 'src/app/components/dashboard1/current-visits/current-visits.component';
import { AppKeyInsightsComponent } from 'src/app/components/dashboard1/key-insights/key-insights.component';
import { AppTrafficDataComponent } from 'src/app/components/dashboard1/traffic-data/traffic-data.component';
import { AppViewFullReportComponent } from 'src/app/components/dashboard1/view-full-report/view-full-report.component';
import { AppVisitorComponent } from 'src/app/components/dashboard1/visitor/visitor.component';
import { AppWebsiteVisitsComponent } from 'src/app/components/dashboard1/website-visits/website-visits.component';



@Component({
  selector: 'app-dashboard1',
  standalone: true,
  imports: [
    TablerIconsModule,
    CommonModule,
    MatCardModule,
    AppViewFullReportComponent,
    AppKeyInsightsComponent,
    AppWebsiteVisitsComponent,
    AppCurrentVisitsComponent,
    AppVisitorComponent,
    AppConversionRateComponent,
    AppAdCampaignClicksComponent,
    AppCampaignPerformanceComponent,
    AppTrafficDataComponent,

  ],
  templateUrl: './dashboard1.component.html',
})
export class AppDashboard1Component {

}