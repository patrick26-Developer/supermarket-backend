import { Inject, Injectable } from "@nestjs/common";

import type { PaymentMethodValue } from "../sales/types/sales-enums";
import { CashProvider } from "./providers/cash.provider";
import { FakeMobileMoneyProvider } from "./providers/fake-mobile-money.provider";
import type { PaymentProvider } from "./providers/payment-provider.interface";

/**
 * Point de branchement unique pour ajouter un vrai provider plus tard :
 * remplacer `this.fakeMobileMoney` par un `MtnMomoProvider`/`AirtelMoneyProvider`
 * dédié pour le(s) méthode(s) concernée(s) — aucun autre fichier à toucher.
 */
@Injectable()
export class PaymentProviderRegistry {
  constructor(
    @Inject(CashProvider) private readonly cash: CashProvider,
    @Inject(FakeMobileMoneyProvider) private readonly fakeMobileMoney: FakeMobileMoneyProvider,
  ) {}

  resolve(method: PaymentMethodValue): PaymentProvider {
    if (method === "CASH") return this.cash;
    // MTN_MOMO, AIRTEL_MONEY, CARD, BANK_TRANSFER, OTHER : simulés pour l'instant.
    return this.fakeMobileMoney;
  }
}
