import { Component, EventEmitter, Output } from '@angular/core';
@Component({
  selector: 'app-upgrade-modal',
  standalone: true,
  templateUrl: './upgrade-modal.component.html',
  styleUrls: ['./upgrade-modal.component.scss'] // 🔥 ADD THIS
})


export class UpgradeModalComponent {

  @Output() closeModal = new EventEmitter<void>();

  close() {
    this.closeModal.emit();
  }
}