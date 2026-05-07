import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { BrandingComponent } from './branding.component';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { navItems } from './sidebar-data';

import { AppNavItemComponent } from './nav-item/nav-item.component';
import { NgScrollbarModule } from 'ngx-scrollbar';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    BrandingComponent,
    TablerIconsModule,
    MaterialModule,
    AppNavItemComponent,
    NgScrollbarModule
  ],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent implements OnInit {

  constructor() { }

  @Input() showToggle = true;
  @Input() isCollapsed: boolean = false;
  @Input() items: any[] = [];
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<boolean>();
  @Output() upgradeClick = new EventEmitter<void>();



  // ✅ IMPORTANT: ab filter nahi karenge
  filteredNavItems: any[] = [];
  plan: string = '';
  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.plan = user?.plan?.toLowerCase() || 'basic';

    // ✅ parent se jo aa raha hai wahi use karo
    this.filteredNavItems = this.items;

    console.log('✅ Sidebar Items:', this.filteredNavItems);
  }

  onToggle() {
    this.isCollapsed = !this.isCollapsed;
    this.toggleCollapsed.emit(this.isCollapsed);
  }

  // 🔒 LOCK CHECK
  isLocked(item: any): boolean {
    return item.locked && this.plan === 'basic';
  }

  // 🔥 MAIN CLICK HANDLER (MOST IMPORTANT)
  onItemClick(item: any, event: Event): void {

    if (this.isLocked(item)) {
      event.preventDefault();
      event.stopPropagation();

      this.openUpgradePopup();
      return;
    }

    // ✅ Dropdown open only if NOT locked
    if (item.children) {
      item.expanded = !item.expanded;
    }

    // ✅ Navigation (agar route hai)
    if (item.route) {
      // router.navigate([item.route]);
    }
  }
  openUpgradePopup() {
    this.upgradeClick.emit();
  }
}