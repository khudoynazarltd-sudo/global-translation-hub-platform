import type Stripe from "stripe";
import { after } from "next/server";
import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { preparePaidConversion } from "./event";
import { destination, googleAdsAccessToken, uploadMode } from "./client";

// Keep analytics failures outside the payment/order error path.
export async function recordPaidConversion(
  order: { id: string; order_reference: string },
  enquiryId: string,
  session: Stripe.Checkout.Session,
  event: Stripe.Event
) {
  try {
    const { data: enquiry, error } = await supabaseAdmin.from("enquiries")
      .select("gclid, google_ads_consent").eq("id", enquiryId).single();
    if (error || !enquiry) throw new Error("enquiry_lookup");
    const prepared = preparePaidConversion({
      live: event.livemode && session.livemode,
      amountMinor: session.amount_total,
      currency: session.currency,
      timestampSeconds: event.created,
      orderReference: order.order_reference,
      gclid: enquiry.gclid,
      consent: enquiry.google_ads_consent,
    });
    const { error: writeError } = await supabaseAdmin.from("google_ads_conversion_outbox")
      .upsert({
        order_id: order.id,
        order_reference: order.order_reference,
        stripe_session_id: session.id,
        stripe_event_id: event.id,
        status: "event" in prepared ? "pending" : "skipped",
        skip_reason: "reason" in prepared ? prepared.reason : null,
        event_payload: "event" in prepared ? prepared.event : null,
      }, { onConflict: "order_id", ignoreDuplicates: true });
    if (writeError) throw new Error("outbox_write");
    // The durable record exists before the response and survives a killed worker.
    after(async () => {
      try { await processConversion(order.id); }
      catch { console.error("Google Ads worker failed; use the conversions admin page.", { orderId: order.id }); }
    });
  } catch {
    console.error("Google Ads enqueue failed; resend the original Stripe event after repair.", {
      orderId: order.id, stripeEventId: event.id,
    });
  }
}

export async function processConversion(orderId: string, retry = false) {
  const mode = uploadMode();
  if (mode === "disabled") return "disabled";
  const { data: candidate, error: candidateError } = await supabaseAdmin.from("google_ads_conversion_outbox")
    .select("status").eq("order_id", orderId).maybeSingle();
  if (candidateError) throw new Error("queue_lookup_failed");
  if (!candidate || ["skipped", "submitted"].includes(candidate.status)) return "not_eligible";
  const { data: order, error: orderError } = await supabaseAdmin.from("orders")
    .select("enquiry_id").eq("id", orderId).single();
  if (orderError || !order) throw new Error("order_lookup_failed");
  const { data: consent, error: consentError } = await supabaseAdmin.from("enquiries")
    .select("google_ads_consent").eq("id", order.enquiry_id).single();
  if (consentError || !consent) throw new Error("consent_lookup_failed");
  if (consent.google_ads_consent !== "accepted") return "consent_not_granted";
  // Obtain credentials before claiming so authentication failure leaves work pending.
  const target = destination();
  const accessToken = await googleAdsAccessToken();
  const claimToken = randomUUID();
  const { data, error } = await supabaseAdmin.rpc("claim_google_ads_conversion", {
    p_order_id: orderId, p_claim_token: claimToken, p_retry: retry,
    p_live: mode === "live",
  });
  if (error) throw new Error("claim_failed");
  const row = data?.[0];
  if (!row) return "not_claimed";

  let status = "unknown";
  let requestId: string | null = null;
  let safeError: string | null = null;
  try {
    const response = await fetch("https://datamanager.googleapis.com/v1/events:ingest", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json",
        "x-goog-user-project": "global-translation-hub",
      },
      body: JSON.stringify({
        destinations: [target], events: [row.event_payload],
        validateOnly: mode !== "live",
      }),
      signal: AbortSignal.timeout(20000),
    });
    // Never log response bodies: they can echo click IDs or other submitted data.
    if (!response.ok) {
      status = response.status >= 500 ? "unknown" : "failed";
      safeError = "google_http_" + response.status;
    } else {
      const body = await response.json();
      requestId = typeof body.requestId === "string" ? body.requestId : null;
      status = mode === "validate" ? "validated" : requestId ? "submitted" : "unknown";
      if (Array.isArray(body.fieldWarnings) && body.fieldWarnings.length) safeError = "google_field_warnings";
    }
  } catch {
    safeError = "network_or_response_error";
  }
  const { error: finishError } = await supabaseAdmin.from("google_ads_conversion_outbox")
    .update({
      status, request_id: requestId, last_error: safeError,
      updated_at: new Date().toISOString(), claim_token: null,
    }).eq("order_id", orderId).eq("claim_token", claimToken);
  if (finishError) throw new Error("result_persistence_failed");
  return status;
}
