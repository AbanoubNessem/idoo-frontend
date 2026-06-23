import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, map, switchMap, catchError } from 'rxjs/operators';
import { LoggerService } from '../../logger/logger.service';
import { ContextFacade } from '../facades/context.facade';
import { SessionManagerService } from '../../auth/services/session-manager.service';
import { UserApiClient } from '../../api/generated/user.api';
import { PermissionStateService } from '../../auth/state/permission.state';

@Injectable({ providedIn: 'root' })
export class ContextInitializationService {
  private readonly logger = inject(LoggerService);
  private readonly contextFacade = inject(ContextFacade);
  private readonly sessionManager = inject(SessionManagerService);
  private readonly userApi = inject(UserApiClient);
  private readonly permissionState = inject(PermissionStateService);

  initializeContext(): Observable<boolean> {
    this.logger.info('CONTEXT', 'Initializing context');
    const user = this.sessionManager.getUser();
    
    if (!user) {
      this.logger.warn('CONTEXT', 'No user found for context initialization');
      return of(false);
    }

    // In a real scenario, this might chain multiple backend calls:
    // 1. Get User Permissions
    // 2. Get User's default Company
    // 3. Get User's default Branch
    // For now, we simulate the sequence to show the pattern.
    
    return this.userApi.getEffectivePermissions(user.id).pipe(
      tap(response => {
        this.logger.info('PERMISSION', 'Permissions loaded', { count: response.data?.length });
        this.permissionState.setPermissions(response.data || []);
      }),
      tap(() => {
        // Initialize Tenant (from user object or token payload)
        if (user.tenantId) {
          this.contextFacade.setTenant(user.tenantId);
          this.logger.info('CONTEXT', 'Tenant loaded', { tenantId: user.tenantId });
        }
        
        // Initialize Company
        if (user.companyId) {
          this.contextFacade.setCompany(user.companyId);
          this.logger.info('CONTEXT', 'Company loaded', { companyId: user.companyId });
        }

        // Branch loading could be here or from another endpoint
        // For demonstration, if we had a default branch:
        // this.contextFacade.setBranch(defaultBranchId);
        // this.logger.info('CONTEXT', 'Branch loaded', { branchId: defaultBranchId });
        
        this.logger.info('CONTEXT', 'Context initialization completed');
      }),
      map(() => true),
      catchError(err => {
        this.logger.error('CONTEXT', 'Failed to initialize context', err);
        return of(false);
      })
    );
  }
}
