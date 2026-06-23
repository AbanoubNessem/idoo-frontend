import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { UserFacade } from '../../../core/api/facades/user.facade';
import { CompanyApiClient } from '../../../core/api/generated/company.api';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { buildUserFormSchema } from '../shared/users-form.schema';
import { FormMode, FormSchema } from '../../../shared/models/dynamic-form.models';
import { UserRequest, UserUpdateRequest } from '../../../core/api/models';

/**
 * Single component handles Create, Edit, and View for the User entity —
 * driven by route data (`mode`) and the shared FormSchema.
 * Eliminates the need for separate CreateUserComponent / EditUserComponent / ViewUserComponent.
 */
@Component({
  selector: 'app-user-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DynamicFormComponent, PageHeaderComponent],
  template: `
    <app-page-header
      [title]="pageTitle()"
      [breadcrumbs]="[{ label: 'Home', link: '/app' }, { label: 'Users', link: '/app/users' }, { label: pageTitle() }]"
    />

    @if (schema()) {
      <app-dynamic-form
        [schema]="schema()!"
        [mode]="mode"
        [data]="formData()"
        (submitted)="onSubmit($event)"
        (cancelled)="onCancel()"
      />
    }
  `,
})
export class UserFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userFacade = inject(UserFacade);
  private readonly companyApi = inject(CompanyApiClient);

  mode: FormMode = 'create';
  private userId: string | null = null;

  readonly schema = signal<FormSchema | null>(null);
  readonly formData = signal<Record<string, unknown> | null>(null);

  pageTitle(): string {
    return { create: 'Create User', edit: 'Edit User', view: 'View User' }[this.mode];
  }

  ngOnInit(): void {
    this.mode = (this.route.snapshot.data['mode'] as FormMode) ?? 'create';
    this.userId = this.route.snapshot.paramMap.get('id');

    this.companyApi.getAll({ page: 0, size: 100 }).subscribe(response => {
      this.schema.set(buildUserFormSchema(response.data.content));
    });

    if (this.userId && this.mode !== 'create') {
      this.userFacade.getUser(this.userId).subscribe(user => this.formData.set(user as unknown as Record<string, unknown>));
    }
  }

  onSubmit(value: Record<string, unknown>): void {
    if (this.mode === 'create') {
      this.userFacade.createUser(value as unknown as UserRequest).subscribe(() => this.navigateBack());
    } else if (this.mode === 'edit' && this.userId) {
      this.userFacade.updateUser(this.userId, value as unknown as UserUpdateRequest).subscribe(() => this.navigateBack());
    }
  }

  onCancel(): void {
    this.navigateBack();
  }

  private navigateBack(): void {
    this.router.navigate(['/app/users']);
  }
}
