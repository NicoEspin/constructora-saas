import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { TenantContextService } from '../tenant-context/tenant-context.service';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user as { sub?: string; tenantId?: string; activeTenantId?: string };
    const headerTenantId = req.headers['x-tenant-id'] as string | undefined;
    const tenantId =
      req.tenantId ||
      headerTenantId ||
      user?.activeTenantId ||
      user?.tenantId ||
      this.tenantContext.getTenantId();

    if (!tenantId) {
      throw new ForbiddenException('Tenant context is required');
    }

    req.tenantId = tenantId;

    // Verify user is a member of this tenant
    if (user?.sub) {
      const membership = await this.prisma.membership.findUnique({
        where: {
          tenantId_userId: {
            tenantId,
            userId: user.sub,
          },
        },
      });

      if (!membership) {
        throw new ForbiddenException('You are not a member of this tenant');
      }
    }

    return true;
  }
}
