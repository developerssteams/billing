import { Component } from '@angular/core';
import { MaterialModule } from '../../../material.module';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-conversion-rate',
  imports: [MaterialModule, RouterModule],
  templateUrl: './conversion-rate.component.html',
})
export class AppConversionRateComponent {
  constructor() {}
}
