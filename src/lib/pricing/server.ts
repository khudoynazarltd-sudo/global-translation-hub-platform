import {
  supabaseAdmin,
} from "@/lib/supabase/admin";


export type ServerQuoteCalculation = {
  requiresManualReview: boolean;
  amount: number | null;
  currency: "GBP";
};


const DOCUMENT_TYPE_CODES: Record<
  string,
  string
> = {
  "Birth Certificate":
    "birth_certificate",

  "Marriage Certificate":
    "marriage_certificate",

  "Police Certificate":
    "police_certificate",

  "Passport / ID":
    "passport",

  "Diploma / Academic Certificate":
    "diploma",

  "Academic Transcript":
    "academic_transcript",

  "Legal Document":
    "legal_document",

  "Court Document":
    "court_document",

  "Medical Document":
    "medical_document",

  "Business Document":
    "business_document",

  "Other":
    "other",
};


function money(
  amount: number
) {
  return (
    Math.round(
      amount * 100
    ) / 100
  );
}


export async function calculateServerQuote({
  sourceLanguage,
  targetLanguage,
  documentType,
  turnaround,
}: {
  sourceLanguage: string;
  targetLanguage: string;
  documentType: string;
  turnaround: string;
}): Promise<ServerQuoteCalculation> {

  /*
    "Other" and "Not sure" are intentionally
    never automatically priced.
  */

  if (
    sourceLanguage === "Other" ||
    sourceLanguage === "Not sure"
  ) {
    return {
      requiresManualReview:
        true,

      amount:
        null,

      currency:
        "GBP",
    };
  }


  const serviceCode =
    DOCUMENT_TYPE_CODES[
      documentType
    ];


  if (!serviceCode) {
    return {
      requiresManualReview:
        true,

      amount:
        null,

      currency:
        "GBP",
    };
  }


  /*
    Load service.
  */

  const {
    data: service,
    error: serviceError,
  } =
    await supabaseAdmin
      .from("service_types")
      .select(`
        id,
        code,
        manual_review,
        active
      `)
      .eq(
        "code",
        serviceCode
      )
      .eq(
        "active",
        true
      )
      .maybeSingle();


  if (
    serviceError ||
    !service
  ) {
    console.error(
      "Pricing service lookup failed:",
      serviceError
    );

    return {
      requiresManualReview:
        true,

      amount:
        null,

      currency:
        "GBP",
    };
  }


  /*
    Complex services always require manual review.
  */

  if (
    service.manual_review
  ) {
    return {
      requiresManualReview:
        true,

      amount:
        null,

      currency:
        "GBP",
    };
  }


  /*
    Find source and target languages.
  */

  const {
    data: languageRows,
    error: languageError,
  } =
    await supabaseAdmin
      .from("languages")
      .select(`
        id,
        name,
        active
      `)
      .in(
        "name",
        [
          sourceLanguage,
          targetLanguage,
        ]
      )
      .eq(
        "active",
        true
      );


  if (
    languageError ||
    !languageRows
  ) {
    console.error(
      "Pricing language lookup failed:",
      languageError
    );

    return manualReview();
  }


  const source =
    languageRows.find(
      (language) =>
        language.name ===
        sourceLanguage
    );


  const target =
    languageRows.find(
      (language) =>
        language.name ===
        targetLanguage
    );


  if (
    !source ||
    !target
  ) {
    return manualReview();
  }


  /*
    First priority:
    service-specific override.
  */

  const {
    data: override,
    error: overrideError,
  } =
    await supabaseAdmin
      .from(
        "service_language_prices"
      )
      .select(`
        price,
        manual_review,
        active
      `)
      .eq(
        "service_id",
        service.id
      )
      .eq(
        "source_language_id",
        source.id
      )
      .eq(
        "target_language_id",
        target.id
      )
      .eq(
        "active",
        true
      )
      .maybeSingle();


  if (overrideError) {
    console.error(
      "Pricing override lookup failed:",
      overrideError
    );
  }


  if (
    override?.manual_review
  ) {
    return manualReview();
  }


  let basePrice:
    number | null =
    override
      ? Number(
          override.price
        )
      : null;


  /*
    No override:
    use language-pair base price.
  */

  if (
    basePrice === null
  ) {
    const {
      data: pairPrice,
      error: pairPriceError,
    } =
      await supabaseAdmin
        .from(
          "language_pair_prices"
        )
        .select(`
          base_price,
          active
        `)
        .eq(
          "source_language_id",
          source.id
        )
        .eq(
          "target_language_id",
          target.id
        )
        .eq(
          "active",
          true
        )
        .maybeSingle();


    if (
      pairPriceError ||
      !pairPrice
    ) {
      console.error(
        "Language pair price lookup failed:",
        pairPriceError
      );

      return manualReview();
    }


    basePrice =
      Number(
        pairPrice.base_price
      );
  }


  if (
    !Number.isFinite(
      basePrice
    ) ||
    basePrice <= 0
  ) {
    return manualReview();
  }


  /*
    Turnaround multiplier.
  */

  const {
    data: settings,
    error: settingsError,
  } =
    await supabaseAdmin
      .from(
        "pricing_settings"
      )
      .select(`
        standard_multiplier,
        priority_multiplier,
        urgent_multiplier
      `)
      .eq(
        "id",
        1
      )
      .maybeSingle();


  if (
    settingsError ||
    !settings
  ) {
    console.error(
      "Pricing settings lookup failed:",
      settingsError
    );

    return manualReview();
  }


  let multiplier =
    Number(
      settings.standard_multiplier
    );


  if (
    turnaround ===
    "Priority"
  ) {
    multiplier =
      Number(
        settings.priority_multiplier
      );
  }


  if (
    turnaround ===
    "Urgent"
  ) {
    multiplier =
      Number(
        settings.urgent_multiplier
      );
  }


  if (
    !Number.isFinite(
      multiplier
    ) ||
    multiplier <= 0
  ) {
    return manualReview();
  }


  return {
    requiresManualReview:
      false,

    amount:
      money(
        basePrice *
          multiplier
      ),

    currency:
      "GBP",
  };
}


function manualReview():
  ServerQuoteCalculation {
  return {
    requiresManualReview:
      true,

    amount:
      null,

    currency:
      "GBP",
  };
}