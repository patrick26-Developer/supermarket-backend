import { BadRequestException, Injectable, type PipeTransform } from "@nestjs/common";
import { plainToInstance, type ClassConstructor } from "class-transformer";
import { validate } from "class-validator";

/**
 * `@Body(new ValidateBodyPipe(LoginDto)) dto: LoginDto` — validation DTO
 * explicite, indépendante de la réflexion de type.
 *
 * Pourquoi : ce projet transpile avec esbuild (tsx en dev, esbuild pour le
 * build), qui n'émet PAS les métadonnées `design:paramtypes` /
 * `emitDecoratorMetadata`. Le `ValidationPipe` global de NestJS déduit le DTO
 * à valider via le type réfléchi du paramètre `@Body()` — sans cette
 * métadonnée, il retombe sur `Object` et **saute silencieusement la
 * validation** (aucune erreur, le payload passe tel quel). D'où ce pipe :
 * la classe DTO est passée explicitement, donc aucune réflexion requise.
 *
 * Convention du projet (comme `@Inject()` pour l'injection de constructeur,
 * voir prisma.service.ts / auth.service.ts) : utiliser ce pipe sur tout
 * `@Body()`/`@Query()` validé par DTO, jamais compter sur le seul type
 * TypeScript du paramètre.
 */
@Injectable()
export class ValidateBodyPipe<T extends object> implements PipeTransform<unknown, Promise<T>> {
  constructor(private readonly dtoClass: ClassConstructor<T>) {}

  async transform(value: unknown): Promise<T> {
    const instance = plainToInstance(this.dtoClass, value ?? {});
    const errors = await validate(instance, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length > 0) {
      const messages = errors.flatMap((error) => Object.values(error.constraints ?? {}));
      throw new BadRequestException(messages);
    }
    return instance;
  }
}
