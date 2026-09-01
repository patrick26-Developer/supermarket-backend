import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";

import type {
  PaymentInitiationParams,
  PaymentInitiationResult,
  PaymentProvider,
} from "./payment-provider.interface";

/**
 * Simule MTN_MOMO / AIRTEL_MONEY / CARD / BANK_TRANSFER / OTHER en attendant
 * les identifiants réels des opérateurs. Confirme toujours, sauf
 * `forceFailure: true` explicite (pour tester le chemin d'échec côté client).
 *
 * `providerRef` est préfixé `FAKE-` pour qu'un paiement simulé ne soit jamais
 * confondu avec une vraie transaction dans les rapports/l'audit une fois de
 * vrais paiements en production.
 *
 * À remplacer par un vrai provider (ex. MtnMomoProvider) implémentant la même
 * interface `PaymentProvider` dès que les identifiants sont disponibles —
 * voir payment-provider.registry.ts pour le point de branchement.
 */
@Injectable()
export class FakeMobileMoneyProvider implements PaymentProvider {
  async initiate(params: PaymentInitiationParams): Promise<PaymentInitiationResult> {
    if (params.forceFailure) {
      return {
        status: "FAILED",
        providerRef: null,
        failureReason: "Paiement simulé refusé (forceFailure demandé)",
      };
    }

    return {
      status: "CONFIRMED",
      providerRef: `FAKE-${randomUUID()}`,
      failureReason: null,
    };
  }
}
