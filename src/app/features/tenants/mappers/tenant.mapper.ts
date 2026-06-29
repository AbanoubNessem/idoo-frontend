// ============================================================
// Tenant API Mapper – Maps backend DTOs to domain models
// ============================================================

import { TenantResponse } from '../../../core/api/models';
import { TenantStatus, SubscriptionPlan } from '../enums/tenant.enums';
import { TenantListItem, TenantDetail, TenantStatistics } from '../models/tenant.models';

export class TenantMapper {

  static toListItem(dto: TenantResponse): TenantListItem {
    return {
      id:                    dto.id,
      code:                  dto.code,
      name:                  dto.name,
      domain:                dto.domain ?? '',
      logoUrl:               dto.logoUrl ?? null,
      status:                TenantMapper.mapStatus(dto.isActive),
      subscriptionPlan:      TenantMapper.mapPlan(dto.subscriptionPlan ?? ''),
      maxUsers:              dto.maxUsers ?? 0,
      subscriptionExpiresAt: dto.subscriptionExpiresAt ?? null,
      createdAt:             dto.createdAt,
      updatedAt:             dto.updatedAt,
    };
  }

  static toDetail(dto: TenantResponse): TenantDetail {
    return {
      ...TenantMapper.toListItem(dto),
      settings:    dto.settings ?? null,
    };
  }

  static toStatistics(tenants: TenantListItem[]): TenantStatistics {
    return {
      totalTenants:        tenants.length,
      activeTenants:       tenants.filter(t => t.status === TenantStatus.ACTIVE).length,
      trialTenants:        tenants.filter(t => t.status === TenantStatus.TRIAL).length,
      suspendedTenants:    tenants.filter(t => t.status === TenantStatus.SUSPENDED).length,
      totalTrendData:      [20, 21, 22, 23, 24, 24, 24],
      activeTrendData:     [18, 19, 20, 20, 21, 21, 21],
      trialTrendData:      [3, 2, 2, 3, 2, 2, 2],
      suspendedTrendData:  [1, 1, 1, 1, 1, 1, 1],
    };
  }

  private static mapStatus(isActive: boolean): TenantStatus {
    return isActive ? TenantStatus.ACTIVE : TenantStatus.INACTIVE;
  }

  private static mapPlan(plan: string): SubscriptionPlan {
    const normalized = plan?.toUpperCase() as SubscriptionPlan;
    return Object.values(SubscriptionPlan).includes(normalized)
      ? normalized
      : SubscriptionPlan.STANDARD;
  }
}
