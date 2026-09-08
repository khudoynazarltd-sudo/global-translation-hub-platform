export const SOURCE_LANGUAGES = [
  "English",
  "Russian",
  "Tajik",
  "Chinese",
  "Other",
  "Not sure",
] as const;

export const TARGET_LANGUAGES = [
  "English",
  "Russian",
  "Tajik",
  "Chinese",
] as const;

export const DOCUMENT_TYPES = [
  "Birth Certificate",
  "Marriage Certificate",
  "Police Certificate",
  "Passport / ID",
  "Diploma / Academic Certificate",
  "Academic Transcript",
  "Legal Document",
  "Court Document",
  "Medical Document",
  "Business Document",
  "Other",
] as const;

export const PURPOSES = [
  "UK Immigration / Visa",
  "Legal Matter",
  "Court Proceedings",
  "Education",
  "Employment",
  "Business",
  "Personal",
  "Other",
] as const;

export const TURNAROUNDS = [
  "Standard",
  "Priority",
  "Urgent",
] as const;

const BASE_PRICES: Record<string, number> = {
  "Birth Certificate": 35,
  "Marriage Certificate": 35,
  "Police Certificate": 35,
  "Passport / ID": 30,
  "Diploma / Academic Certificate": 35,
};

const MANUAL_REVIEW_DOCUMENTS = new Set([
  "Academic Transcript",
  "Legal Document",
  "Court Document",
  "Medical Document",
  "Business Document",
  "Other",
]);

export type QuoteCalculation = {
  requiresManualReview: boolean;
  amount: number | null;
  currency: "GBP";
};

export function calculateQuote(input: {
  sourceLanguage: string;
  targetLanguage: string;
  documentType: string;
  turnaround: string;
}): QuoteCalculation {
  const requiresManualReview =
    MANUAL_REVIEW_DOCUMENTS.has(input.documentType) ||
    input.sourceLanguage === "Other" ||
    input.sourceLanguage === "Not sure";

  if (requiresManualReview) {
    return {
      requiresManualReview: true,
      amount: null,
      currency: "GBP",
    };
  }

  const basePrice = BASE_PRICES[input.documentType];

  if (!basePrice) {
    return {
      requiresManualReview: true,
      amount: null,
      currency: "GBP",
    };
  }

  let amount = basePrice;

  if (input.turnaround === "Priority") {
    amount = Math.round(basePrice * 1.3);
  }

  if (input.turnaround === "Urgent") {
    amount = Math.round(basePrice * 1.7);
  }

  return {
    requiresManualReview: false,
    amount,
    currency: "GBP",
  };
}