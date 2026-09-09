import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { processConversion } from "@/lib/google-ads/outbox";
import { googleAdsAccessToken, uploadMode } from "@/lib/google-ads/client";

export const dynamic = "force-dynamic";

async function retry(form: FormData) {
  "use server";
  await requireAdmin();
  const orderId = String(form.get("orderId") || "");
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return;
  let result = "failed";
  try { result = await processConversion(orderId, true); } catch { result = "configuration_or_database_error"; }
  redirect("/admin/google-ads?result=" + encodeURIComponent(result));
}

async function checkAuth() {
  "use server";
  await requireAdmin();
  let result = "authentication_failed";
  try {
    await googleAdsAccessToken();
    result = "authentication_ok";
  } catch {}
  redirect("/admin/google-ads?result=" + result);
}

export default async function GoogleAdsPage({ searchParams }: {
  searchParams: Promise<{ result?: string }>;
}) {
  await requireAdmin();
  const { result } = await searchParams;
  const { data, error } = await supabaseAdmin.from("google_ads_conversion_outbox")
    .select("order_id, order_reference, status, skip_reason, attempts, last_error, request_id, updated_at")
    .order("created_at", { ascending: false }).limit(100);
  return <main className="mx-auto max-w-6xl space-y-6 p-8">
    <Link href="/admin" className="underline">Back to admin</Link>
    <h1 className="text-3xl font-semibold">Google Ads paid orders</h1>
    <p>Upload mode: <strong>{uploadMode()}</strong>. Only consented live GBP payments with a Google click ID are eligible.</p>
    <p>Submitted means Google accepted the request for processing. It does not yet confirm matching to an ad click; check Google Ads import diagnostics before enabling campaigns.</p>
    {result && <p role="status">Last operation: {result.replaceAll("_", " ")}</p>}
    <form action={checkAuth}><button className="rounded border px-4 py-2">Check Google authentication</button></form>
    {error ? <p role="alert">The conversion queue is unavailable. Check the database migration.</p> :
      <div className="overflow-x-auto"><table className="w-full text-left text-sm">
        <thead><tr>{["Order", "Status", "Attempts", "Details", "Google request", "Action"].map(x => <th className="p-3" key={x}>{x}</th>)}</tr></thead>
        <tbody>{data?.map(row => <tr key={row.order_id} className="border-t">
          <td className="p-3">{row.order_reference}</td><td className="p-3">{row.status}</td>
          <td className="p-3">{row.attempts}</td><td className="p-3">{row.skip_reason || row.last_error || "—"}</td>
          <td className="max-w-48 break-all p-3">{row.request_id || "—"}</td>
          <td className="p-3">{["pending", "failed", "unknown", "processing", "validated"].includes(row.status) &&
            <form action={retry}><input type="hidden" name="orderId" value={row.order_id}/>
              <button className="rounded border px-3 py-2">Process / retry</button></form>}</td>
        </tr>)}</tbody>
      </table>{!data?.length && <p className="py-4">No payment events have been recorded yet.</p>}</div>}
    <p className="text-sm">Retries reuse the same order reference, payment timestamp and click ID. A processing record can be retried after ten minutes. Skipped and submitted records cannot be resent here.</p>
  </main>;
}
