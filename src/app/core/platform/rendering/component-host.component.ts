import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewContainerRef,
  ViewChild,
  ComponentRef,
  ChangeDetectionStrategy,
  Type,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'platform-component-host',
  standalone: true,
  imports: [CommonModule],
  template: `<ng-container #host></ng-container>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentHostComponent implements OnChanges {
  @Input() component: Type<unknown> | null = null;
  @Input() inputs: Record<string, unknown> = {};

  @ViewChild('host', { read: ViewContainerRef, static: true })
  private readonly hostRef!: ViewContainerRef;

  private readonly cdr = inject(ChangeDetectorRef);
  private componentRef: ComponentRef<unknown> | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['component']) {
      this.mountComponent();
    } else if (changes['inputs'] && this.componentRef) {
      this.applyInputs(this.componentRef);
    }
  }

  private mountComponent(): void {
    this.hostRef.clear();
    this.componentRef = null;

    if (!this.component) return;

    this.componentRef = this.hostRef.createComponent(this.component);
    this.applyInputs(this.componentRef);
    this.cdr.markForCheck();
  }

  private applyInputs(ref: ComponentRef<unknown>): void {
    for (const [key, value] of Object.entries(this.inputs)) {
      ref.setInput(key, value);
    }
  }
}
