import { Module } from "@nestjs/common";

import { PaymentProviderRegistry } from "./payment-provider.registry";
import { CashProvider } from "./providers/cash.provider";
import { FakeMobileMoneyProvider } from "./providers/fake-mobile-money.provider";

@Module({
  providers: [CashProvider, FakeMobileMoneyProvider, PaymentProviderRegistry],
  exports: [PaymentProviderRegistry],
})
export class PaymentsModule {}
