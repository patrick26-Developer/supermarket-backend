import { Injectable } from "@nestjs/common";

import type {
  PaymentInitiationParams,
  PaymentInitiationResult,
  PaymentProvider,
} from "./payment-provider.interface";

/** Le cash n'a pas de "provider" réel — confirmation immédiate, pas de référence externe. */
@Injectable()
export class CashProvider implements PaymentProvider {
  async initiate(_params: PaymentInitiationParams): Promise<PaymentInitiationResult> {
    return { status: "CONFIRMED", providerRef: null, failureReason: null };
  }
}
