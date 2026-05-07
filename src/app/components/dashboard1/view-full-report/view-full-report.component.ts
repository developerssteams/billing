import { Component } from '@angular/core';
import { MaterialModule } from '../../../material.module';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-view-full-report',
  imports: [MaterialModule, RouterModule, CommonModule],
  templateUrl: './view-full-report.component.html',
})
export class AppViewFullReportComponent {
  greeting: string = '';
  greetingIcon: string = '';
  iconClass: string = '';

  ngOnInit(): void {
    this.setGreetingByTime();
  }

  // ✅ Must be public for template to call it
  public setGreetingByTime(): void {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      this.greeting = 'Good Morning';
      this.greetingIcon = 'line-md:sunny-filled-loop';
      this.iconClass = 'text-warning';
    } else if (hour >= 12 && hour < 17) {
      this.greeting = 'Good Afternoon';
      this.greetingIcon = 'line-md:sunny-filled-loop';
      this.iconClass = 'text-warning';
    } else if (hour >= 17 && hour < 21) {
      this.greeting = 'Good Evening';
      this.greetingIcon = 'line-md:moon-filled-alt-loop';
      this.iconClass = 'text-white';
    } else {
      this.greeting = 'Good Night';
      this.greetingIcon = 'line-md:moon-filled-alt-loop';
      this.iconClass = 'text-white';
    }
  }
}
