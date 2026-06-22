import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const Role = {
  OWNER: 'OWNER',
} as const;

export interface JwtPayload {
  sub: string;
  email: string;
  activeTenantId?: string;
  roles?: string[];
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

type PrismaExecutor = PrismaService | Prisma.TransactionClient;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('Email already in use');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const email = dto.email.toLowerCase().trim();
    const displayName = dto.displayName?.trim() || null;

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          hashedPassword,
          displayName,
        },
      });

      await this.ensureUserHasTenantMembership({
        userId: createdUser.id,
        email: createdUser.email,
        displayName: createdUser.displayName,
        tenantName: dto.tenantName?.trim() || null,
        prisma: tx,
      });

      return createdUser;
    });

    return { id: user.id, email: user.email };
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.validateUser(dto.email, dto.password);
    const memberships = await this.ensureUserHasTenantMembership({
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
    });
    const activeTenantId = memberships[0]?.tenantId;
    const roles = memberships
      .filter((m: { tenantId: string }) => m.tenantId === activeTenantId)
      .map((m: { role: string }) => m.role);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      activeTenantId,
      roles,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.createRefreshToken(user.id, activeTenantId);

    return { accessToken, refreshToken };
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    const hash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: { tokenHash: hash, revokedAt: null, expiresAt: { gt: new Date() } },
      include: { user: true },
    });
    if (!stored) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate refresh token
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const memberships = await this.ensureUserHasTenantMembership({
      userId: stored.userId,
      email: stored.user.email,
      displayName: stored.user.displayName,
    });
    const activeTenantId = stored.tenantId ?? memberships[0]?.tenantId;
    const roles = memberships
      .filter((m: { tenantId: string }) => m.tenantId === activeTenantId)
      .map((m: { role: string }) => m.role);

    const payload: JwtPayload = {
      sub: stored.userId,
      email: stored.user.email,
      activeTenantId,
      roles,
    };

    const accessToken = this.jwtService.sign(payload);
    const newRefreshToken = await this.createRefreshToken(stored.userId, activeTenantId);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshToken: string) {
    const hash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hash },
      data: { revokedAt: new Date() },
    });
  }

  async switchTenant(userId: string, tenantId: string): Promise<TokenPair> {
    const membership = await this.prisma.membership.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
      include: { user: true, tenant: true },
    });
    if (!membership) {
      throw new UnauthorizedException('Not a member of this tenant');
    }

    const payload: JwtPayload = {
      sub: userId,
      email: membership.user.email,
      activeTenantId: tenantId,
      roles: [membership.role],
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.createRefreshToken(userId, tenantId);

    return { accessToken, refreshToken };
  }

  private async createRefreshToken(userId: string, tenantId?: string): Promise<string> {
    const raw = crypto.randomBytes(32).toString('hex');
    const hash = this.hashToken(raw);
    const expiresIn = this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    const expiresAt = new Date(Date.now() + this.parseDuration(expiresIn));

    await this.prisma.refreshToken.create({
      data: { tokenHash: hash, userId, tenantId, expiresAt },
    });

    return raw;
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async ensureUserHasTenantMembership(input: {
    userId: string;
    email: string;
    displayName?: string | null;
    tenantName?: string | null;
    prisma?: PrismaExecutor;
  }) {
    const prisma = input.prisma ?? this.prisma;

    const existingMemberships = await prisma.membership.findMany({
      where: { userId: input.userId },
      include: { tenant: true },
    });

    if (existingMemberships.length > 0) {
      return existingMemberships;
    }

    const tenantName = this.buildDefaultTenantName(
      input.tenantName ?? null,
      input.displayName,
      input.email,
    );
    const tenantSlug = await this.generateUniqueTenantSlug(prisma, tenantName);

    await prisma.tenant.create({
      data: {
        name: tenantName,
        slug: tenantSlug,
        memberships: {
          create: {
            userId: input.userId,
            role: Role.OWNER,
          },
        },
      },
    });

    return prisma.membership.findMany({
      where: { userId: input.userId },
      include: { tenant: true },
    });
  }

  private buildDefaultTenantName(
    tenantName: string | null | undefined,
    displayName: string | null | undefined,
    email: string,
  ) {
    const normalizedTenantName = tenantName?.trim();
    if (normalizedTenantName) {
      return normalizedTenantName;
    }

    const normalizedDisplayName = displayName?.trim();
    if (normalizedDisplayName) {
      return `${normalizedDisplayName} Constructora`;
    }

    const localPart = email.split('@')[0]?.trim();
    if (localPart) {
      return `Constructora ${localPart}`;
    }

    return 'Mi Constructora';
  }

  private async generateUniqueTenantSlug(prisma: PrismaExecutor, name: string) {
    const baseSlug =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'mi-constructora';

    let slug = baseSlug;
    let suffix = 2;

    while (await prisma.tenant.findUnique({ where: { slug }, select: { id: true } })) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return slug;
  }

  private parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000;
    const value = parseInt(match[1], 10);
    switch (match[2]) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 7 * 24 * 60 * 60 * 1000;
    }
  }
}
