import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';
import { MembershipsModule } from './memberships/memberships.module';
import { RbacModule } from './rbac/rbac.module';
import { AuditModule } from './audit/audit.module';
import { BillingModule } from './billing/billing.module';
import { CacheModule } from './cache/cache.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { HealthModule } from './health/health.module';
import { LoggerModule } from './logger/logger.module';
import { MetricsModule } from './metrics/metrics.module';
import { TracingModule } from './tracing/tracing.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ClientsModule } from './clients/clients.module';
import { BudgetsModule } from './budgets/budgets.module';
import { ProjectsModule } from './projects/projects.module';
import { ExpenseCategoriesModule } from './expense-categories/expense-categories.module';
import { ExpensesModule } from './expenses/expenses.module';
import { ProjectIncomesModule } from './project-incomes/project-incomes.module';
import { ProjectIncidentsModule } from './project-incidents/project-incidents.module';
import { ProjectTemplatesModule } from './project-templates/project-templates.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { MaterialsModule } from './materials/materials.module';
import { DocumentPdfSettingsModule } from './document-pdf-settings/document-pdf-settings.module';
import { StorageModule } from './storage/storage.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { ReportsModule } from './reports/reports.module';
import { PrismaService } from './common/prisma.service';
import { TenantContextModule } from './common/tenant-context/tenant-context.module';
import { TenantContextInterceptor } from './common/interceptors/tenant-context.interceptor';
import { HttpMetricsInterceptor } from './metrics/interceptors/http-metrics.interceptor';
import { HttpLoggingInterceptor } from './logger/interceptors/http-logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TenantContextModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('RATE_LIMIT_TTL', 60) * 1000,
          limit: config.get<number>('RATE_LIMIT_LIMIT', 100),
        },
      ],
    }),
    CacheModule,
    LoggerModule,
    MetricsModule,
    TracingModule,
    HealthModule,
    NotificationsModule,
    ClientsModule,
    BudgetsModule,
    ProjectsModule,
    ProjectTemplatesModule,
    ExpenseCategoriesModule,
    ExpensesModule,
    ProjectIncomesModule,
    ProjectIncidentsModule,
    SuppliersModule,
    MaterialsModule,
    StorageModule,
    AttachmentsModule,
    ReportsModule,
    DocumentPdfSettingsModule,
    AuthModule,
    TenantsModule,
    UsersModule,
    MembershipsModule,
    RbacModule,
    AuditModule,
    BillingModule,
    FeatureFlagsModule,
  ],
  controllers: [],
  providers: [
    PrismaService,
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
    { provide: APP_INTERCEPTOR, useClass: HttpLoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: HttpMetricsInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
