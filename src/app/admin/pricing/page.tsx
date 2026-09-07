import Link from "next/link";

import {
  requireAdmin,
} from "@/lib/auth/require-admin";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";

import PricingManager from "@/app/admin/pricing/PricingManager";


export const dynamic =
  "force-dynamic";


export default async function AdminPricingPage() {
  await requireAdmin();


  const {
    data: services,
    error: servicesError,
  } =
    await supabaseAdmin
      .from("service_types")
      .select(`
        id,
        code,
        name,
        description,
        base_price,
        manual_review,
        active,
        sort_order
      `)
      .order(
        "sort_order",
        {
          ascending: true,
        }
      );


  const {
    data: languages,
    error: languagesError,
  } =
    await supabaseAdmin
      .from("languages")
      .select(`
        id,
        code,
        name,
        active,
        sort_order
      `)
      .order(
        "sort_order",
        {
          ascending: true,
        }
      );

  const {
    data: pairPrices,
    error: pairPricesError,
  } =
    await supabaseAdmin
      .from(
        "language_pair_prices"
      )
      .select(`
        id,
        source_language_id,
        target_language_id,
        base_price,
        active
      `)
      .order(
        "created_at",
        {
          ascending: true,
        }
      );



  const {
    data: languagePrices,
    error: languagePricesError,
  } =
    await supabaseAdmin
      .from(
        "service_language_prices"
      )
      .select(`
        id,
        service_id,
        source_language_id,
        target_language_id,
        price,
        manual_review,
        active
      `)
      .order(
        "created_at",
        {
          ascending: false,
        }
      );


  const {
    data: pricingSettings,
    error: settingsError,
  } =
    await supabaseAdmin
      .from("pricing_settings")
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
    servicesError ||
    languagesError ||
    languagePricesError ||
    settingsError
  ) {
    console.error(
      "Unable to load pricing:",
      {
        servicesError,
        languagesError,
        languagePricesError,
        settingsError,
      }
    );
  }


  return (
    <main className="min-h-screen bg-[#f5f8f6] px-6 py-10 text-[#13201a]">

      <div className="mx-auto max-w-7xl">

        <Link
          href="/admin"
          className="text-sm font-semibold text-[#087f5b]"
        >
          ← Dashboard
        </Link>


        <div className="mt-5">

          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#087f5b]">
            Administration
          </div>

          <h1 className="mt-2 text-4xl font-bold">
            Pricing Management
          </h1>

          <p className="mt-3 max-w-3xl leading-7 text-[#607067]">
            Manage translation services, languages,
            language-specific pricing and turnaround
            multipliers.
          </p>

        </div>


        <PricingManager
          services={
            services ?? []
          }
          languages={
            languages ?? []
          }
          pairPrices={
            pairPrices ?? []
          }
          languagePrices={
            languagePrices ?? []
          }
          settings={
            pricingSettings ?? {
              standard_multiplier: 1,
              priority_multiplier: 1.3,
              urgent_multiplier: 1.7,
            }
          }
        />

      </div>

    </main>
  );
}