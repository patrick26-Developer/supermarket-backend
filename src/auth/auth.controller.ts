import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Post } from "@nestjs/common";

import { ValidateBodyPipe } from "../common/pipes/validate-body.pipe";
import { AuthService } from "./auth.service";
import { CurrentUser } from "./decorators/current-user.decorator";
import { Public } from "./decorators/public.decorator";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import type { JwtAccessPayload } from "./types/jwt-payload.type";

@Controller("auth")
export class AuthController {
  // esbuild/tsx n'émet pas `design:paramtypes` : @Inject() explicite requis.
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("login")
  login(@Body(new ValidateBodyPipe(LoginDto)) dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("refresh")
  refresh(@Body(new ValidateBodyPipe(RefreshTokenDto)) dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  /** Utile côté client Electron pour valider un token restauré au démarrage. */
  @Get("me")
  me(@CurrentUser() user: JwtAccessPayload) {
    return user;
  }
}
