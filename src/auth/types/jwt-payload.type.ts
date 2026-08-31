import type { RoleCode } from "./permission.types";

/** Contenu du access token. Signé avec `JWT_ACCESS_SECRET`. */
export interface JwtAccessPayload {
  /** userId (subject) */
  sub: string;
  email: string;
  roles: RoleCode[];
}

/** Contenu du refresh token. Signé séparément avec `JWT_REFRESH_SECRET`. */
export interface JwtRefreshPayload {
  sub: string;
}
