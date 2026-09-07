import {
  requireTranslator,
} from "@/lib/auth/require-translator";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";

import TranslatorLogout from "@/app/translator/TranslatorLogout";

import ClaimOrderButton from "@/app/translator/ClaimOrderButton";


export const dynamic =
  "force-dynamic";

export default async function TranslatorDashboardPage() {
  const {
    translator,
  } =
    await requireTranslator();


  const {
    data: languagePairs,
    error: languageError,
  } =
    await supabaseAdmin
      .from(
        "translator_language_pairs"
      )
      .select(`
        id,
        source_language,
        target_language
      `)
      .eq(
        "translator_id",
        translator.id
      )
      .eq(
        "active",
        true
      )
      .order(
        "source_language",
        {
          ascending: true,
        }
      );


  if (languageError) {
    console.error(
      "Unable to load translator language pairs:",
      languageError
    );
  }


  /*
    AVAILABLE ORDERS
  */

  const {
    data: unassignedOrders,
    error: availableOrdersError,
  } =
    await supabaseAdmin
      .from("orders")
      .select(`
        id,
        order_reference,
        status,
        paid_at,
        created_at,
        assigned_translator_id,

        enquiries (
          source_language,
          target_language,
          document_type,
          turnaround
        )
      `)
      .is(
        "assigned_translator_id",
        null
      )
      .not(
        "paid_at",
        "is",
        null
      )
      .order(
        "created_at",
        {
          ascending: true,
        }
      );


  if (availableOrdersError) {
    console.error(
      "Unable to load available orders:",
      availableOrdersError
    );
  }


  const approvedLanguagePairs =
    new Set(
      (languagePairs ?? []).map(
        (pair) =>
          `${pair.source_language}|||${pair.target_language}`
      )
    );


  const availableOrders =
    (unassignedOrders ?? []).filter(
      (order) => {
        const enquiry =
          Array.isArray(
            order.enquiries
          )
            ? order.enquiries[0]
            : order.enquiries;


        if (
          !enquiry?.source_language ||
          !enquiry?.target_language
        ) {
          return false;
        }


        return approvedLanguagePairs.has(
          `${enquiry.source_language}|||${enquiry.target_language}`
        );
      }
    );


  const {
    data: myOrders,
    error: ordersError,
  } =
    await supabaseAdmin
      .from("orders")
      .select(`
        id,
        order_reference,
        status,
        claimed_at,
        created_at,

        enquiries (
          source_language,
          target_language,
          document_type,
          turnaround
        )
      `)
      .eq(
        "assigned_translator_id",
        translator.id
      )
      .order(
        "claimed_at",
        {
          ascending: false,
        }
      );


  const myOrdersCount =
    myOrders?.length ?? 0;


  if (ordersError) {
    console.error(
      "Unable to load translator orders:",
      ordersError
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f7f5] text-[#13201a]">

      <header className="border-b border-[#dce6df] bg-white">

        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-5">

          <div>

            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#087f5b]">
              GLOBAL TRANSLATION HUB
            </div>

            <div className="mt-1 font-semibold">
              Translator Portal
            </div>

          </div>

          <TranslatorLogout />

        </div>

      </header>


      <div className="mx-auto max-w-6xl px-6 py-10">

        <div>

          <div className="text-sm text-[#69766f]">
            Welcome
          </div>

          <h1 className="mt-1 text-3xl font-bold">
            {translator.display_name}
          </h1>

        </div>


        <div className="mt-8 grid gap-5 md:grid-cols-2">

          <div className="rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm">

            <div className="text-sm font-semibold text-[#69766f]">
              Available Orders
            </div>

            <div className="mt-3 text-3xl font-bold text-[#087f5b]">
              {availableOrders.length}
            </div>

            <p className="mt-2 text-sm text-[#69766f]">
              Paid unassigned orders matching your
              approved language pairs.
            </p>

          </div>


          <div className="rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm">

            <div className="text-sm font-semibold text-[#69766f]">
              My Orders
            </div>

            <div className="mt-3 text-3xl font-bold">
              {myOrdersCount ?? 0}
            </div>

            <p className="mt-2 text-sm text-[#69766f]">
              Orders currently assigned to you.
            </p>

          </div>

        </div>


        <section className="mt-8 rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm">

          <h2 className="text-xl font-bold">
            My Language Pairs
          </h2>

          <p className="mt-2 text-sm text-[#69766f]">
            Available orders will be matched against these
            approved language directions.
          </p>


          <div className="mt-5 flex flex-wrap gap-2">

            {(languagePairs ?? []).map(
              (pair) => (
                <span
                  key={pair.id}
                  className="rounded-full bg-[#eef7f2] px-4 py-2 text-sm font-semibold text-[#087f5b]"
                >
                  {pair.source_language}
                  {" → "}
                  {pair.target_language}
                </span>
              )
            )}


            {(languagePairs ?? [])
              .length === 0 && (
              <span className="text-sm text-[#69766f]">
                No active language pairs have been assigned.
              </span>
            )}

          </div>

        </section>


        <section className="mt-8">

          <div className="flex items-end justify-between gap-4">

            <div>

              <h2 className="text-xl font-bold">
                Available Orders
              </h2>

              <p className="mt-2 text-sm text-[#69766f]">
                Orders are available on a first-claim basis.
              </p>

            </div>

          </div>


          <div className="mt-4 space-y-4">

            {availableOrders.map(
              (order) => {
                const enquiry =
                  Array.isArray(
                    order.enquiries
                  )
                    ? order.enquiries[0]
                    : order.enquiries;


                return (
                  <article
                    key={order.id}
                    className="rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm"
                  >

                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                      <div>

                        <div className="text-xs font-semibold uppercase tracking-[0.15em] text-[#087f5b]">
                          Translation Order
                        </div>

                        <div className="mt-2 text-xl font-bold">
                          {order.order_reference}
                        </div>


                        <div className="mt-4 flex flex-wrap gap-2">

                          <span className="rounded-full bg-[#eef7f2] px-3 py-1 text-sm font-semibold text-[#087f5b]">
                            {enquiry?.source_language}
                            {" → "}
                            {enquiry?.target_language}
                          </span>


                          {enquiry?.document_type && (
                            <span className="rounded-full bg-[#f1f3f2] px-3 py-1 text-sm text-[#4d5d54]">
                              {
                                enquiry.document_type
                              }
                            </span>
                          )}


                          {enquiry?.turnaround && (
                            <span className="rounded-full bg-[#f1f3f2] px-3 py-1 text-sm text-[#4d5d54]">
                              {
                                enquiry.turnaround
                              }
                            </span>
                          )}

                        </div>


                        <div className="mt-4 text-sm text-[#69766f]">
                          Received:{" "}
                          {new Date(
                            order.created_at
                          ).toLocaleString(
                            "en-GB"
                          )}
                        </div>

                      </div>


                      <ClaimOrderButton
                        orderId={
                          order.id
                        }
                      />

                    </div>

                  </article>
                );
              }
            )}


            {availableOrders.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#bfd0c5] bg-white p-8 text-center">

                <div className="font-semibold">
                  No matching orders are currently available.
                </div>

                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#69766f]">
                  New eligible orders matching your
                  approved language pairs will appear here.
                </p>

              </div>
            )}

          </div>

        </section>

        <section className="mt-10">

          <div>
            <h2 className="text-xl font-bold">
              My Orders
            </h2>

            <p className="mt-2 text-sm text-[#69766f]">
              Translation orders currently assigned to you.
            </p>
          </div>


          <div className="mt-4 space-y-4">

            {(myOrders ?? []).map(
              (order) => {
                const enquiry =
                  Array.isArray(order.enquiries)
                    ? order.enquiries[0]
                    : order.enquiries;


                return (
                  <article
                    key={order.id}
                    className="rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm"
                  >

                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                      <div>

                        <div className="text-xs font-semibold uppercase tracking-[0.15em] text-[#087f5b]">
                          Assigned Order
                        </div>

                        <div className="mt-2 text-xl font-bold">
                          {order.order_reference}
                        </div>


                        <div className="mt-4 flex flex-wrap gap-2">

                          <span className="rounded-full bg-[#eef7f2] px-3 py-1 text-sm font-semibold text-[#087f5b]">
                            {enquiry?.source_language}
                            {" → "}
                            {enquiry?.target_language}
                          </span>


                          {enquiry?.document_type && (
                            <span className="rounded-full bg-[#f1f3f2] px-3 py-1 text-sm text-[#4d5d54]">
                              {enquiry.document_type}
                            </span>
                          )}

                        </div>


                        {order.claimed_at && (
                          <div className="mt-4 text-sm text-[#69766f]">
                            Claimed:{" "}
                            {new Date(
                              order.claimed_at
                            ).toLocaleString("en-GB")}
                          </div>
                        )}

                      </div>


                      <a
                        href={`/translator/orders/${order.order_reference}`}
                        className="inline-flex justify-center rounded-xl bg-[#102b20] px-5 py-3 font-semibold text-white"
                      >
                        Open Order
                      </a>

                    </div>

                  </article>
                );
              }
            )}


            {(myOrders ?? []).length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#bfd0c5] bg-white p-8 text-center text-sm text-[#69766f]">
                You do not currently have any assigned orders.
              </div>
            )}

          </div>

        </section>

      </div>

    </main>
  );
}