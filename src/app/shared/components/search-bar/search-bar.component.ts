import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

/**
 * Debounced search input — emits only after 300ms of inactivity and on value change,
 * preventing excessive API calls (O(1) network call per pause instead of O(n) keystrokes).
 */
@Component({
  selector: 'app-search-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <mat-form-field appearance="outline" class="search-field">
      <mat-icon matPrefix>search</mat-icon>
      <input matInput [placeholder]="placeholder" [(ngModel)]="value" (ngModelChange)="onValueChange($event)" />
    </mat-form-field>
  `,
  styles: [`.search-field { width: 100%; max-width: 320px; }`],
})
export class SearchBarComponent {
  @Input() placeholder = 'Search...';
  @Output() searchChange = new EventEmitter<string>();

  value = '';
  private readonly searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
    ).subscribe(term => this.searchChange.emit(term));
  }

  onValueChange(term: string): void {
    this.searchSubject.next(term);
  }
}
