import { UnprocessableEntityException } from "@nestjs/common";

/**
 * 422 plutôt que 400 : la requête était valide, c'est le paiement lui-même
 * qui a été refusé (par le provider, réel ou simulé) — distinction utile
 * pour le client Electron (afficher "paiement refusé, réessayer" plutôt que
 * "requête invalide, corrige le formulaire").
 */
export class PaymentFailedException extends UnprocessableEntityException {
  constructor(reason: string) {
    super({ message: `Paiement refusé : ${reason}`, error: "Payment Failed" });
  }
}
