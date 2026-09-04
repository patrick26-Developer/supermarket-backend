import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { extname, join } from "node:path";

import { BadRequestException, Controller, Post, Req, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request } from "express";
import { diskStorage } from "multer";

import { RequirePermission } from "../auth/decorators/require-permission.decorator";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

// Racines servies statiquement par `main.ts` (`app.useStaticAssets`, préfixe
// `/uploads`) — hors du préfixe `/api` puisque ce sont des fichiers, pas des
// routes API.
const PRODUCTS_UPLOAD_DIR = join(process.cwd(), "uploads", "products");
const AVATARS_UPLOAD_DIR = join(process.cwd(), "uploads", "avatars");
for (const dir of [PRODUCTS_UPLOAD_DIR, AVATARS_UPLOAD_DIR]) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

@Controller("uploads")
export class UploadsController {
  // Même permission que la modification d'un produit : uploader une image
  // n'a de sens que pour quelqu'un qui peut ensuite l'attacher à un produit.
  @RequirePermission("PRODUCTS", "UPDATE")
  @Post("product-image")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: PRODUCTS_UPLOAD_DIR,
        filename: (_req, file, callback) => {
          callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
      // Type inféré depuis les options attendues par FileInterceptor — ne
      // pas extraire cette closure vers une fonction nommée typée à la main
      // (multer.FileFilterCallback ne correspond pas exactement au type
      // inline attendu ici et fait échouer tsc sur une incompatibilité de
      // variance des paramètres du callback).
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
          callback(
            new BadRequestException("Format d'image non supporté (JPEG, PNG, WEBP ou GIF uniquement)."),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  uploadProductImage(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: Request,
  ): { url: string } {
    if (!file) {
      throw new BadRequestException("Aucun fichier reçu.");
    }
    // URL absolue, pas juste un chemin relatif : Product.imageUrl est validé
    // par `@IsUrl()` côté DTO (CreateProductDto/UpdateProductDto), qui
    // rejette un chemin sans protocole/hôte.
    return { url: `${req.protocol}://${req.get("host")}/uploads/products/${file.filename}` };
  }

  // Aucune permission spécifique : n'importe quel utilisateur connecté peut
  // téléverser sa propre photo de profil (JwtAuthGuard seul suffit — voir
  // AppModule, § ordre des guards).
  @Post("avatar")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: AVATARS_UPLOAD_DIR,
        filename: (_req, file, callback) => {
          callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
          callback(
            new BadRequestException("Format d'image non supporté (JPEG, PNG, WEBP ou GIF uniquement)."),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  uploadAvatar(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: Request,
  ): { url: string } {
    if (!file) {
      throw new BadRequestException("Aucun fichier reçu.");
    }
    return { url: `${req.protocol}://${req.get("host")}/uploads/avatars/${file.filename}` };
  }
}
