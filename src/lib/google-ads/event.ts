export type PaidConversionInput = {
  live: boolean;
  amountMinor: number | null;
  currency: string | null;
  timestampSeconds: number;
  orderReference: string;
  gclid: string | null;
  consent: string | null;
};

export function preparePaidConversion(input: PaidConversionInput) {
  if (!input.live) return { reason: "test_payment" } as const;
  if (!input.gclid) return { reason: "no_gclid" } as const;
  if (/^(test|fake|dummy)([-_]|$)/i.test(input.gclid) ||
      !/^[A-Za-z0-9_-]{10,1000}$/.test(input.gclid)) {
    return { reason: "invalid_or_test_gclid" } as const;
  }
  if (input.consent !== "accepted") return { reason: "no_ads_consent" } as const;
  if (input.currency?.toLowerCase() !== "gbp" ||
      !Number.isSafeInteger(input.amountMinor) || (input.amountMinor ?? 0) <= 0) {
    return { reason: "invalid_paid_amount_or_currency" } as const;
  }
  if (!input.orderReference.startsWith("GTH-") ||
      !Number.isSafeInteger(input.timestampSeconds) || input.timestampSeconds <= 0) {
    return { reason: "invalid_order_or_timestamp" } as const;
  }
  return {
    event: {
      transactionId: input.orderReference,
      eventTimestamp: new Date(input.timestampSeconds * 1000).toISOString(),
      adIdentifiers: { gclid: input.gclid },
      conversionValue: input.amountMinor! / 100,
      currency: "GBP",
      eventSource: "WEB",
      consent: {
        adUserData: "CONSENT_GRANTED",
        adPersonalization: "CONSENT_GRANTED",
      },
    },
  } as const;
}
