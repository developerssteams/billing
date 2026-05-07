import {
  Component,
  HostBinding,
  Input,
  OnInit,
  OnChanges,
  Output,
  EventEmitter,
} from '@angular/core';
import { NavItem } from './nav-item';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { NavService } from '../../../../../services/nav.service';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { TranslateModule } from '@ngx-translate/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nav-item',
  standalone: true,
  imports: [TranslateModule, RouterModule, TablerIconsModule, MaterialModule, CommonModule],
  templateUrl: './nav-item.component.html',
  animations: [
    trigger('indicatorRotate', [
      state('collapsed', style({ transform: 'rotate(0deg)' })),
      state('expanded', style({ transform: 'rotate(180deg)' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4,0.0,0.2,1)')
      ),
    ]),
  ],
})
export class AppNavItemComponent implements OnChanges, OnInit {

  @Output() notify: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() item: NavItem | any;
  @Input() depth: any;
  @Output() upgradeClick = new EventEmitter<void>();

  expanded: boolean = false;

  @HostBinding('attr.aria-expanded') ariaExpanded = this.expanded;

  plan: string = '';

  constructor(public navService: NavService, public router: Router) {
    if (this.depth === undefined) {
      this.depth = 0;
    }
  }

  ngOnInit() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.plan = user?.plan?.toLowerCase() || 'basic';
    const currentUrl = this.router.url;
    if (this.item.children && this.item.children.length) {
      this.expanded = this.item.children.some((child: any) =>
        currentUrl.includes(child.route)
      );
    }
  }

  ngOnChanges() {
    const url = this.navService.currentUrl();
    if (this.item.route && url) {
      this.expanded = url.indexOf(`/${this.item.route}`) === 0;
      this.ariaExpanded = this.expanded;
    }
  }

  handleClick(item: any, event: Event) {
    console.log(item);
    if (item.locked && this.plan === 'basic') {
      this.upgradeClick.emit();
      return;
    }

    if (item.children && item.children.length) {
      this.expanded = !this.expanded;
      return;
    }

    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  isDirectlyActive(item: NavItem): boolean {
    return !!item.route && this.router.isActive(item.route, true);
  }

  isChildActive(item: NavItem): boolean {
    if (!item.children) return false;
    return item.children.some(
      (child) => this.isDirectlyActive(child) || this.isChildActive(child)
    );
  }
}