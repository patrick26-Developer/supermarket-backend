import { Controller, Get } from "@nestjs/common";

import { Public } from "./auth/decorators/public.decorator";

@Controller()
export class AppController {
  /** Health-check non authentifié, exclu du préfixe /api (voir main.ts). */
  @Public()
  @Get()
  getRoot() {
    return {
      message: "hello from create-prisma + nest",
    };
  }
}
