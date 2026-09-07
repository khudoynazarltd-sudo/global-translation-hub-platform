import { requireAdmin } from "@/lib/auth/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
  }>;
}) {
  await requireAdmin();

  const {
    status,
  } = await searchParams;


  let ordersQuery =
    supabaseAdmin
      .from("orders")
      .select(`
        id,
        order_reference,
        status,
        paid_at,
        assigned_translator_id,
        claimed_at,
        enquiries (
          full_name,
          email,
          source_language,
          target_language,
          document_type,
          turnaround,
          indicative_price
        )
      `);


  if (status) {
    ordersQuery =
      ordersQuery.eq(
        "status",
        status
      );
  }


  const {
    data: orders,
    error,
  } =
    await ordersQuery.order(
      "created_at",
      {
        ascending: false,
      }
    );


  if (error) {
    throw new Error("Unable to load orders.");
  }


  const {
    data: translators,
    error: translatorsError,
  } = await supabaseAdmin
    .from("translators")
    .select(`
      id,
      display_name
    `);


  if (translatorsError) {
    console.error(
      "Unable to load translators:",
      translatorsError
    );
  }


  const translatorMap =
    new Map(
      (translators ?? []).map(
        (translator) => [
          translator.id,
          translator.display_name,
        ]
      )
    );


  return (
    <main className="min-h-screen bg-[#f5f8f6] px-6 py-10 text-[#13201a]">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-5">
          <div>
            <a
              href="/admin"
              className="text-sm font-semibold text-[#087f5b]"
            >
              в†ђ Dashboard
            </a>

            <h1 className="mt-3 text-4xl font-bold">
              {status === "in_translation"
                ? "Orders In Translation"
                : status === "quality_check"
                  ? "Orders in Quality Check"
                  : "Orders"}
            </h1>

            {status && (
              <div className="mt-4">
                <a
                  href="/admin/orders"
                  className="text-sm font-semibold text-[#087f5b]"
                >
                  Clear filter
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-[#dce6df] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f3f7f4]">
                <tr>
                  <th className="px-5 py-4">Reference</th>
                  <th className="px-5 py-4">Client</th>
                  <th className="px-5 py-4">Language</th>
                  <th className="px-5 py-4">Document</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Translator</th>
                  <th className="px-5 py-4">Claimed At</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              </thead>

              <tbody>
                {(orders ?? []).map((order: any) => {
                  const enquiry =
                    Array.isArray(order.enquiries)
                      ? order.enquiries[0]
                      : order.enquiries;

                  const translatorName =
                    order.assigned_translator_id
                      ? translatorMap.get(
                          order.assigned_translator_id
                        )
                      : null;

                  return (
                    <tr
                      key={order.id}
                      className="border-t border-[#edf1ee]"
                    >
                      <td className="px-5 py-4">
                        <a
                          href={`/admin/orders/${order.order_reference}`}
                          className="font-semibold text-[#087f5b]"
                        >
                          {order.order_reference}
                        </a>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium">
                          {enquiry?.full_name}
                        </div>

                        <div className="text-xs text-[#6b776f]">
                          {enquiry?.email}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {enquiry?.source_language} в†’{" "}
                        {enquiry?.target_language}
                      </td>

                      <td className="px-5 py-4">
                        {enquiry?.document_type}
                      </td>

                      <td className="px-5 py-4">
                        ВЈ{Number(
                          enquiry?.indicative_price ?? 0
                        ).toFixed(2)}
                      </td>


                      <td className="px-5 py-4">
                        {translatorName ? (
                          <span className="font-medium">
                            {translatorName}
                          </span>
                        ) : (
                          <span className="text-[#8a6418]">
                            Unassigned
                          </span>
                        )}
                      </td>


                      <td className="px-5 py-4 whitespace-nowrap">
                        {order.claimed_at
                          ? new Date(
                              order.claimed_at
                            ).toLocaleString(
                              "en-GB"
                            )
                          : "вЂ”"}
                      </td>


                      <td className="px-5 py-4">
                        {order.status}
                      </td>
                    </tr>
                  );
                })}

                {(orders ?? []).length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-10 text-center text-[#6b776f]"
                    >
                      No paid orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
