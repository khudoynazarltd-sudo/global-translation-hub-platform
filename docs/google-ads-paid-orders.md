# Google Ads paid orders

Google Cloud: global-translation-hub (487478850567).
Service account: gth-ads-conversions@global-translation-hub.iam.gserviceaccount.com.
Federation: gth-vercel-production / vercel; restricted to the production subject
of khudoynazarltd-sudo/global-translation-hub-platform. No private keys.
Ads customer: 8030346268. Offline action: 7754946948 (Secondary).

## Operation

Apply supabase/migrations/20260909_google_ads_conversions.sql before deploying.
GOOGLE_ADS_CUSTOMER_ID=8030346268 is a server configuration value.
GOOGLE_ADS_UPLOAD_MODE accepts disabled (default), validate, or live.
The admin-only /admin/google-ads page checks authentication and offers controlled
per-order processing/retries. No cron or campaign activation is configured.
The queue uses unique order/session identifiers and an atomic database claim.
Repeated callbacks preserve the original payload and successful submissions.
Network ambiguity is recorded as unknown; inspect Google diagnostics before retrying.
Retries preserve the transaction ID, timestamp, click ID and revenue. Submitted
does not mean Google matched the conversion to an ad click.

Only signed Stripe checkout.session.completed events that are live and paid,
with an explicit amount_total in GBP, an enquiry GCLID and accepted consent qualify.
Known test click prefixes are blocked. Syntax checks cannot prove click authenticity.
Historical enquiries without recorded consent are skipped. No backfill is performed.
The worker also rechecks the enquiry consent before sending; to honour a withdrawal,
set that enquiry's google_ads_consent to rejected before processing pending records.
No customer names, email addresses, documents or card details are uploaded.

Google failures never escape the analytics helper into the payment result.
If queue insertion fails, repair the database then resend the original Stripe event;
the existing-order branch can enqueue without creating another order.
If a worker stops, the queue persists. After 10 minutes an administrator may reclaim
the work. Review unknown outcomes before doing so.

## Verification

npm run test:google-ads (Node 22+): policy fixtures and an isolated PostgreSQL engine.
npm run build; git diff --check.
Never send the local fixtures or TEST-GCLID-123 to Google, including validation mode.
Authentication can be tested without any conversion payload.
For end-to-end verification use a genuine consented ad-originated paid order,
confirm request diagnostics and the correct one-time GBP conversion in Google Ads.
Keep campaigns paused and the offline action Secondary until that is proven.
Direct/referral orders must show skipped/no_gclid and retain normal payment processing.

References:
- https://developers.google.com/data-manager/api/devguides/quickstart/set-up-access
- https://developers.google.com/data-manager/api/devguides/events/send-events
- https://developers.google.com/data-manager/api/reference/rest/v1/events/ingest
- https://vercel.com/docs/oidc/gcp
