import {
  Component,
  Output,
  EventEmitter,
  Input,
  ViewEncapsulation,
} from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { MatDialog } from '@angular/material/dialog';
import { navItems } from '../sidebar/sidebar-data';
import { TranslateService } from '@ngx-translate/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { RouterModule } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { FormsModule } from '@angular/forms';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { AppSettings } from 'src/app/config';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-header',
  imports: [
    RouterModule,
    NgScrollbarModule,
    TablerIconsModule,
    MaterialModule
  ],
  templateUrl: './header.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class HeaderComponent {
  searchQuery: string = '';  // Search query variable
  searchResults: string[] = [];  // Array to store search results
  recentSearches: string[] = [];  // Array to store recent searches
  user: any = {};
  isCollapse: boolean = false;

  @Input() showToggle = true;
  @Input() toggleChecked = false;

  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleShoppingCartNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<boolean>(); // 🔥 FIX TYPE
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


  openDialog() {
    const dialogRef = this.dialog.open(AppSearchDialogComponent);
    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }

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
  selector: 'search-dialog',
  imports: [
    RouterModule,
    MaterialModule,
    TablerIconsModule,
    FormsModule,
    MatDividerModule,
  ],
  templateUrl: 'search-dialog.component.html',
})
export class AppSearchDialogComponent {
  searchText: string = '';
  navItems = navItems;
  navItemsData = navItems.filter((navitem) => navitem.displayName);
}