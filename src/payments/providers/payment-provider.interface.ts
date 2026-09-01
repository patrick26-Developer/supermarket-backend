export interface PaymentInitiationParams {
  amount: number;
  /** Référence interne du paiement (Payment.reference) — pour corrélation côté provider. */
  reference: string;
  /** Test uniquement : force un échec simulé, quel que soit le provider. */
  forceFailure?: boolean;
}

export interface PaymentInitiationResult {
  status: "CONFIRMED" | "FAILED";
  /** Référence externe (id de transaction MTN/Airtel/etc.), null pour CASH. */
  providerRef: string | null;
  failureReason: string | null;
}

/**
 * Abstraction commune à toutes les méthodes de paiement. Un vrai provider
 * MTN/Airtel (branché plus tard, une fois les identifiants obtenus) implémente
 * la même interface — aucun changement requis dans SalesService ni dans les
 * DTOs le jour où on les branche.
 *
 * Important pour les futurs providers réels : `initiate()` fait l'appel HTTP
 * externe AVANT que SalesService n'ouvre sa transaction DB (voir
 * sales.service.ts) — ne jamais faire d'appel réseau à l'intérieur d'une
 * transaction ouverte.
 */
export interface PaymentProvider {
  initiate(params: PaymentInitiationParams): Promise<PaymentInitiationResult>;
}
