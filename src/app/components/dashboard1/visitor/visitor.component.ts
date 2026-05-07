import { Component } from '@angular/core';
import { MaterialModule } from '../../../material.module';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-visitor',
  imports: [MaterialModule, RouterModule],
  templateUrl: './visitor.component.html',
})
export class AppVisitorComponent {
  constructor() {}
}
