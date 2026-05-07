import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { MatDialog } from '@angular/material/dialog';
import { navItems } from '../../vertical/sidebar/sidebar-data';
import { TranslateService } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { BrandingComponent } from '../../vertical/sidebar/branding.component';
import { AppSettings } from 'src/app/config';
import { FormsModule } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-horizontal-header',
  imports: [RouterModule, TablerIconsModule, MaterialModule, BrandingComponent],
  templateUrl: './header.component.html',
})
export class AppHorizontalHeaderComponent {

  user: any = {};
  isCollapse: boolean = false;

  @Input() showToggle = true;
  @Input() toggleChecked = false;

  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleShoppingCartNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<boolean>(); // 🔥 FIX
  @Output() optionsChange = new EventEmitter<AppSettings>();

  constructor(
    private settings: CoreService,
    private vsidenav: CoreService,
    public dialog: MatDialog,
    private translate: TranslateService,
    public auth: AuthService
  ) {
    translate.setDefaultLang('en');
  }

  options = this.settings.getOptions();

  // 🔥 INIT
  ngOnInit() {

    const userData = localStorage.getItem('user');
    this.user = userData ? JSON.parse(userData) : {};

    this.loadSettings();

    setTimeout(() => {
      this.emitOptions();
      this.toggleCollapsed.emit(this.isCollapse); // 🔥 FORCE APPLY
    }, 0);
  }

  // 🔥 SAVE SETTINGS PER USER
  saveSettings() {
    if (!this.user?.id) return;

    const settings = {
      theme: this.options.theme,
      sidebar: this.isCollapse
    };

    localStorage.setItem(`settings_${this.user.id}`, JSON.stringify(settings));
  }

  // 🔥 LOAD SETTINGS PER USER
  loadSettings() {
    if (!this.user?.id) return;

    const saved = localStorage.getItem(`settings_${this.user.id}`);

    if (saved) {
      const settings = JSON.parse(saved);

      this.options.theme = settings.theme || 'light';
      this.isCollapse = settings.sidebar || false;

      this.emitOptions(); // 🔥 APPLY THEME
      this.toggleCollapsed.emit(this.isCollapse); // 🔥 APPLY SIDEBAR
    }
  }

  // 🔥 THEME CHANGE
  setlightDark(theme: string) {
    this.options.theme = theme;
    this.saveSettings();
    this.emitOptions();
  }

  // 🔥 SIDEBAR TOGGLE
  toggleCollpase() {
    this.isCollapse = !this.isCollapse;

    this.saveSettings();
    this.toggleCollapsed.emit(this.isCollapse); // 🔥 FIX
  }

  private emitOptions() {
    this.optionsChange.emit(this.options);
  }

  // 🔍 SEARCH
  openDialog() {
    const dialogRef = this.dialog.open(AppHorizontalSearchDialogComponent);
    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }

  // 🔔 NOTIFICATIONS
  notifications = [
    {
      id: 1,
      icon: 'solar:widget-3-line-duotone',
      color: 'primary',
      time: '9:30 AM',
      title: 'Launch Admin',
      subtitle: 'Just see the my new admin!',
    },
  ];

  // 👤 PROFILE DROPDOWN
  profiledd = [
    {
      id: 1,
      icon: 'solar:home-angle-line-duotone',
      title: 'Home',
      link: '/',
    },
    {
      id: 2,
      icon: 'solar:user-rounded-line-duotone',
      title: 'Profile',
      link: '/',
    },
    {
      id: 3,
      icon: 'solar:folder-with-files-line-duotone',
      title: 'Invoice',
      new: true,
      link: '/apps/invoice',
    },
    {
      id: 4,
      icon: 'solar:keyboard-line-duotone',
      title: 'Subscription',
      link: '/theme-pages/account-setting',
    },
    {
      id: 5,
      icon: 'solar:settings-line-duotone',
      title: 'Account Settings',
      link: '/authentication/login',
    },
  ];
}

@Component({
  selector: 'app-search-dialog',
  imports: [RouterModule, MaterialModule, TablerIconsModule, FormsModule],
  templateUrl: 'search-dialog.component.html',
})
export class AppHorizontalSearchDialogComponent {
  searchText: string = '';
  navItems = navItems;
  navItemsData = navItems.filter((navitem) => navitem.displayName);
}