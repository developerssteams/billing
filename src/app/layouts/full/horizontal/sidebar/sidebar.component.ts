import {
  Component,
  OnInit,
  Input,
  ChangeDetectorRef,
  OnChanges,
} from '@angular/core';
import { navItems as sidebarData } from 'src/app/layouts/full/vertical/sidebar/sidebar-data';
import { Router } from '@angular/router';
import { NavService } from '../../../../services/nav.service';
import { MediaMatcher } from '@angular/cdk/layout';
import { AppHorizontalNavItemComponent } from './nav-item/nav-item.component';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-horizontal-sidebar',
  imports: [AppHorizontalNavItemComponent, CommonModule],
  templateUrl: './sidebar.component.html',
})
export class AppHorizontalSidebarComponent implements OnInit {
  navItems = sidebarData;
  parentActive = '';

  mobileQuery: MediaQueryList;
  private _mobileQueryListener: () => void;

  constructor(
    public navService: NavService,
    public router: Router,
    media: MediaMatcher,
    changeDetectorRef: ChangeDetectorRef
  ) {
    this.mobileQuery = media.matchMedia('(min-width: 1100px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
    this.router.events.subscribe(
      () => (this.parentActive = this.router.url.split('/')[1])
    );
  }

  filteredNavItems: any[] = [];
plan: string = '';

ngOnInit() {

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  this.plan = user?.plan?.toLowerCase();

  console.log('📊 [HORIZONTAL PLAN]:', this.plan);

  this.filteredNavItems = sidebarData.filter((item: any) => {

    if (item.divider) return true;

    const allowed = !item.plan || item.plan.includes(this.plan);

    console.log(`🔍 [H] ${item.displayName} → ${allowed}`);

    return allowed;
  });

  console.log('✅ [HORIZONTAL FINAL]:', this.filteredNavItems);
}
}
