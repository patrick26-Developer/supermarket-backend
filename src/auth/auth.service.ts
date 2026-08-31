import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService, type JwtSignOptions } from "@nestjs/jwt";
import { compare } from "bcryptjs";
import { Temporal } from "temporal-polyfill";

import { PrismaService } from "../prisma.service";
import type { LoginDto } from "./dto/login.dto";
import type { JwtAccessPayload, JwtRefreshPayload } from "./types/jwt-payload.type";
import type { RoleCode } from "./types/permission.types";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult extends AuthTokens {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: RoleCode[];
  };
}

const INVALID_CREDENTIALS = "Identifiants invalides";

@Injectable()
export class AuthService {
  // esbuild/tsx n'émet pas `design:paramtypes` : @Inject() explicite requis.
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(JwtService) private readonly jwt: JwtService,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.prisma.db.orm.public.User.where({ email: dto.email }).first();
    if (!user) throw new UnauthorizedException(INVALID_CREDENTIALS);
    if (user.status !== "ACTIVE") {
      throw new UnauthorizedException(`Compte ${user.status.toLowerCase()}, connexion refusée`);
    }

    const passwordValid = await compare(dto.password, user.passwordHash);
    if (!passwordValid) throw new UnauthorizedException(INVALID_CREDENTIALS);

    const roles = await this.getRoleCodes(user.id);
    const tokens = await this.issueTokens({ sub: user.id, email: user.email, roles });

    // Colonne timestamptz "temporal" : le codec attend un Temporal.Instant, pas un Date natif.
    await this.prisma.db.orm.public.User
      .where({ id: user.id })
      .update({ lastLoginAt: Temporal.Now.instant() });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
      },
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: JwtRefreshPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtRefreshPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
      });
    } catch {
      throw new UnauthorizedException("Refresh token invalide ou expiré");
    }

    const user = await this.prisma.db.orm.public.User.where({ id: payload.sub }).first();
    if (!user || user.status !== "ACTIVE") {
      throw new UnauthorizedException("Compte introuvable ou inactif");
    }

    const roles = await this.getRoleCodes(user.id);
    return this.issueTokens({ sub: user.id, email: user.email, roles });
  }

  private async getRoleCodes(userId: string): Promise<RoleCode[]> {
    const userRoles = await this.prisma.db.orm.public.UserRole.where({ userId })
      .include("role", (r) => r.select("code"))
      .all();
    return userRoles.map((ur) => ur.role.code);
  }

  private async issueTokens(payload: JwtAccessPayload): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
        expiresIn: (this.config.get<string>("JWT_ACCESS_EXPIRES_IN") ?? "15m") as JwtSignOptions["expiresIn"],
      }),
      this.jwt.signAsync(
        { sub: payload.sub } satisfies JwtRefreshPayload,
        {
          secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
          expiresIn: (this.config.get<string>("JWT_REFRESH_EXPIRES_IN") ?? "30d") as JwtSignOptions["expiresIn"],
        },
      ),
    ]);
    return { accessToken, refreshToken };
  }
}
