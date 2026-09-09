import { getVercelOidcToken } from "@vercel/oidc";
import { ExternalAccountClient } from "google-auth-library";

export function uploadMode() {
  const value = process.env.GOOGLE_ADS_UPLOAD_MODE;
  return value === "live" || value === "validate" ? value : "disabled";
}

export async function googleAdsAccessToken() {
  if (process.env.VERCEL_ENV !== "production") throw new Error("production_required");
  const auth = ExternalAccountClient.fromJSON({
    type: "external_account",
    audience: "//iam.googleapis.com/projects/487478850567/locations/global/workloadIdentityPools/gth-vercel-production/providers/vercel",
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url:
      "https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/gth-ads-conversions@global-translation-hub.iam.gserviceaccount.com:generateAccessToken",
    // Do not pass Google supplier context: its audience is not a Vercel token audience.
    subject_token_supplier: { getSubjectToken: () => getVercelOidcToken() },
  });
  if (!auth) throw new Error("auth_configuration");
  auth.scopes = ["https://www.googleapis.com/auth/datamanager"];
  const result = await auth.getAccessToken();
  if (!result.token) throw new Error("missing_access_token");
  return result.token;
}

export function destination() {
  // This is the Ads customer ID, NOT the AW tag ID.
  const accountId = process.env.GOOGLE_ADS_CUSTOMER_ID;
  if (!accountId || !/^\d{10}$/.test(accountId)) throw new Error("customer_id_missing");
  return {
    operatingAccount: { accountType: "GOOGLE_ADS", accountId },
    productDestinationId: "7754946948",
  };
}
