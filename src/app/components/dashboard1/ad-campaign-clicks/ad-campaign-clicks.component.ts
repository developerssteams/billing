import { Component } from '@angular/core';
import { MaterialModule } from '../../../material.module';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-ad-campaign-clicks',
  imports: [MaterialModule, RouterModule],
  templateUrl: './ad-campaign-clicks.component.html',
})
export class AppAdCampaignClicksComponent {
  constructor() {}
}
