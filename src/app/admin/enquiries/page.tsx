import { requireAdmin } from "@/lib/auth/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminEnquiriesPage() {
  await requireAdmin();

  const { data: enquiries, error } =
    await supabaseAdmin
      .from("enquiries")
      .select("*")
      .eq("requires_manual_review", true)
      .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Unable to load enquiries.");
  }

  return (
    <main className="min-h-screen bg-[#f5f8f6] px-6 py-10 text-[#13201a]">
      <div className="mx-auto max-w-7xl">
        <a
          href="/admin"
          className="text-sm font-semibold text-[#087f5b]"
        >
          ← Dashboard
        </a>

        <h1 className="mt-3 text-4xl font-bold">
          Manual Review Enquiries
        </h1>

        <div className="mt-8 space-y-4">
          {(enquiries ?? []).map((item) => (
          <a
            key={item.id}
            href={`/admin/enquiries/${item.id}`}
            className="block rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm transition hover:border-[#9db9a8] hover:shadow-md"
          >

            <div className="flex items-start justify-between gap-5">

              <div>

                <div className="font-bold">
                  {item.document_type}
                </div>

              <div className="mt-2 text-sm text-[#607067]">
                {item.full_name} · {item.email}
              </div>

              <div className="mt-2 text-sm">
                {item.source_language} →{" "}
                {item.target_language}
              </div>

              <div className="mt-2 text-sm">
                Status: {item.status}
              </div>

            </div>


            <div className="shrink-0 font-semibold text-[#087f5b]">
              Open Enquiry →
            </div>

          </div>

        </a>
          ))}

          {(enquiries ?? []).length === 0 && (
            <div className="rounded-2xl border border-[#dce6df] bg-white p-8 text-[#607067]">
              No manual-review enquiries.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}