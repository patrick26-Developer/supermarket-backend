import { IsOptional, IsString, IsUrl, MaxLength } from "class-validator";

/**
 * Sous-ensemble de UpdateUserDto pour la mise à jour de son propre profil
 * (PUT /auth/me) : pas de `status`, pas de rôles — ces champs restent
 * réservés à un administrateur via /users/:id.
 */
export class SelfUpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  avatarUrl?: string;
}
