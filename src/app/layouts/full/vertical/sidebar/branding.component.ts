import { Component } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-branding',
  imports: [RouterModule],
  template: `
    <div class="flex items-center">
      <a [routerLink]="['/']" class="logodark">
        <img
          src="./assets/images/logos/dark-logo.svg"
          class="align-middle m-1 rtl:-scale-x-100"
          alt="logo"
        />
      </a>

      <a [routerLink]="['/']" class="logolight">
        <img
          src="./assets/images/logos/light-logo.svg"
          class="align-middle m-1 rtl:-scale-x-100"
          alt="logo"
        />
      </a>
    </div>
  `,
})
export class BrandingComponent {
  options = this.settings.getOptions();
  constructor(private settings: CoreService) { }
}
