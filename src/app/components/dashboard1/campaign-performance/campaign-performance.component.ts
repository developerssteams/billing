import { Component } from '@angular/core';
import { MaterialModule } from '../../../material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatIconModule } from '@angular/material/icon';

interface stats {
  id: number;
  color: string;
  title: string;
  subtitle: string;
  icon: string;
  badge: string;
}

@Component({
  selector: 'app-campaign-performance',
  imports: [MaterialModule, TablerIconsModule, MatIconModule],
  templateUrl: './campaign-performance.component.html',
})
export class AppCampaignPerformanceComponent {
  stats: stats[] = [
    {
      id: 1,
      color: 'primary',
      title: 'Instagram',
      subtitle: '8.49k users',
      icon: 'skill-icons:instagram',
      badge: 'Running',
    },
    {
      id: 2,
      color: 'warning',
      title: 'Google',
      subtitle: '9.12k users',
      icon: 'devicon:google',
      badge: 'Paused',
    },
    {
      id: 3,
      color: 'error',
      title: 'Facebook',
      subtitle: '6.98k users',
      icon: 'logos:facebook',
      badge: 'Stopped',
    },
    {
      id: 4,
      color: 'info',
      title: 'Twiter',
      subtitle: '8.92k users',
      icon: 'skill-icons:twitter',
      badge: 'Completed',
    },
  ];
}
