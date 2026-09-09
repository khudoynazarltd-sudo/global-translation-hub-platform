import { requireAdmin } from "@/lib/auth/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";


export default async function AdminDashboardPage() {
  const { user, adminUser } =
    await requireAdmin();


  const [
    { count: paidOrders },
    { count: manualReview },
    { count: inTranslation },
    { count: qualityCheck },
  ] = await Promise.all([
    supabaseAdmin
      .from("orders")
      .select("*", {
        count: "exact",
        head: true,
      }),

    supabaseAdmin
      .from("enquiries")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq(
        "requires_manual_review",
        true
      ),

    supabaseAdmin
      .from("orders")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq(
        "status",
        "in_translation"
      ),

    supabaseAdmin
      .from("orders")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq(
        "status",
        "quality_check"
      ),
  ]);

    const {
      count: activeTranslatorsCount,
      error: translatorsCountError,
    } = await supabaseAdmin
      .from("translators")
      .select(
        "id",
        {
          count: "exact",
          head: true,
        }
      )
      .eq(
        "active",
        true
      );

    if (translatorsCountError) {
      console.error(
        "Unable to count active translators:",
        translatorsCountError
      );
    }

  const now =
    Date.now();


  const last24Hours =
    new Date(
      now -
        24 *
          60 *
          60 *
          1000
    ).toISOString();


  const last7Days =
    new Date(
      now -
        7 *
          24 *
          60 *
          60 *
          1000
    ).toISOString();


  const last30Days =
    new Date(
      now -
        30 *
          24 *
          60 *
          60 *
          1000
    ).toISOString();


  const [
    visits24Result,
    visits7Result,
    visits30Result,
    analyticsRowsResult,
  ] =
    await Promise.all([
      supabaseAdmin
        .from(
          "website_visits"
        )
        .select(
          "id",
          {
            count:
              "exact",

            head:
              true,
          }
        )
        .gte(
          "created_at",
          last24Hours
        ),

      supabaseAdmin
        .from(
          "website_visits"
        )
        .select(
          "id",
          {
            count:
              "exact",

            head:
              true,
          }
        )
        .gte(
          "created_at",
          last7Days
        ),

      supabaseAdmin
        .from(
          "website_visits"
        )
        .select(
          "id",
          {
            count:
              "exact",

            head:
              true,
          }
        )
        .gte(
          "created_at",
          last30Days
        ),

      supabaseAdmin
        .from(
          "website_visits"
        )
        .select(`
          session_id,
          source,
          medium,
          campaign,
          path,
          referrer,
          created_at
        `)
        .gte(
          "created_at",
          last30Days
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        )
        .limit(
          5000
        ),
    ]);


  const analyticsRows =
    analyticsRowsResult.data ??
    [];

  const uniqueSessions =
    new Set(
      analyticsRows
        .map(
          (visit) =>
            visit.session_id
        )
        .filter(Boolean)
    );


  const uniqueVisitors30 =
    uniqueSessions.size;


  const pageViews30 =
    analyticsRows.length;


  const recentVisits =
    analyticsRows.slice(
      0,
      12
    );


  const sourceCounts =
    new Map<
      string,
      number
    >();


  const landingPageCounts =
    new Map<
      string,
      number
    >();


  const campaignCounts =
    new Map<
      string,
      number
    >();


  for (
    const visit of
    analyticsRows
  ) {
    const sourceLabel =
      visit.medium
        ? `${visit.source} / ${visit.medium}`
        : visit.source;


    sourceCounts.set(
      sourceLabel,
      (
        sourceCounts.get(
          sourceLabel
        ) ??
        0
      ) + 1
    );


    landingPageCounts.set(
      visit.path,
      (
        landingPageCounts.get(
          visit.path
        ) ??
        0
      ) + 1
    );


    if (
      visit.campaign
    ) {
      campaignCounts.set(
        visit.campaign,
        (
          campaignCounts.get(
            visit.campaign
          ) ??
          0
        ) + 1
      );
    }
  }


  const topSources =
    Array.from(
      sourceCounts.entries()
    )
      .sort(
        (a, b) =>
          b[1] -
          a[1]
      )
      .slice(
        0,
        8
      );


  const topLandingPages =
    Array.from(
      landingPageCounts.entries()
    )
      .sort(
        (a, b) =>
          b[1] -
          a[1]
      )
      .slice(
        0,
        8
      );


  const topCampaigns =
    Array.from(
      campaignCounts.entries()
    )
      .sort(
        (a, b) =>
          b[1] -
          a[1]
      )
      .slice(
        0,
        8
      );

  return (
    <main className="min-h-screen bg-[#f5f8f6] text-[#13201a]">
      <header className="border-b border-[#dfe8e2] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <div className="font-bold tracking-wide text-[#087f5b]">
              GLOBAL TRANSLATION HUB
            </div>

            <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[#6b776f]">
              Administration
            </div>
          </div>

          <div className="text-right text-sm">
            <div className="font-semibold">
              {user.email}
            </div>

            <div className="text-[#65736b]">
              {adminUser.role}
            </div>
          </div>
        </div>
      </header>


      <div className="mx-auto max-w-7xl px-6 py-10">
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#087f5b]">
            Operations Dashboard
          </div>

          <h1 className="mt-3 text-4xl font-bold">
            Overview
          </h1>
        </div>


        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">

          <a
            href="/admin/orders"
            className="block transition hover:-translate-y-0.5"
          >
            <DashboardCard
              title="Orders"
              value={paidOrders ?? 0}
            />
          </a>


          <a
            href="/admin/enquiries"
            className="block transition hover:-translate-y-0.5"
          >
            <DashboardCard
              title="Manual Review"
              value={manualReview ?? 0}
            />
          </a>


          <a
            href="/admin/orders?status=in_translation"
            className="block transition hover:-translate-y-0.5"
          >
            <DashboardCard
              title="In Translation"
              value={inTranslation ?? 0}
            />
          </a>

          <a
            href="/admin/orders?status=quality_check"
            className="block transition hover:-translate-y-0.5"
          >
            <DashboardCard
              title="Quality Check"
              value={qualityCheck ?? 0}
            />
          </a>

          <a
            href="/admin/translators"
            className="block transition hover:-translate-y-0.5"
          >
            <DashboardCard
              title="Active Translators"
              value={activeTranslatorsCount ?? 0}
            />
          </a>

        </div>


        <section className="mt-10 rounded-2xl border border-[#dce6df] bg-white p-7 shadow-sm">

      <div>

        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#087f5b]">
          Website Analytics
        </div>

        <h2 className="mt-2 text-2xl font-bold">
          Website Traffic
        </h2>

        <p className="mt-2 text-sm text-[#607067]">
          Internal traffic statistics for the public
          GLOBAL TRANSLATION HUB website.
        </p>

      </div>


      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

        <AnalyticsMetric
          label="Last 24 Hours"
          value={
            visits24Result.count ??
            0
          }
        />

        <AnalyticsMetric
          label="Last 7 Days"
          value={
            visits7Result.count ??
            0
          }
        />

        <AnalyticsMetric
          label="Visitors (30 Days)"
          value={
            uniqueVisitors30
          }
        />

        <AnalyticsMetric
          label="Page Views (30 Days)"
          value={
            pageViews30
          }
        />

        <AnalyticsMetric
          label="Visits (30 Days)"
          value={
            visits30Result.count ??
            0
          }
        />

      </div>


      <div className="mt-8 grid gap-8 lg:grid-cols-3">

        <div>

          <h3 className="font-bold">
            Traffic Sources
          </h3>

          <div className="mt-4 space-y-3">

            {topSources.map(
              ([
                source,
                count,
              ]) => (
                <AnalyticsRow
                  key={
                    source
                  }
                  label={
                    source
                  }
                  value={
                    count
                  }
                />
              )
            )}

            {topSources.length ===
              0 && (
              <div className="text-sm text-[#69766f]">
                No traffic recorded yet.
              </div>
            )}

          </div>

        </div>


        <div>

          <h3 className="font-bold">
            Top Landing Pages
          </h3>

          <div className="mt-4 space-y-3">

            {topLandingPages.map(
              ([
                path,
                count,
              ]) => (
                <AnalyticsRow
                  key={
                    path
                  }
                  label={
                    path
                  }
                  value={
                    count
                  }
                />
              )
            )}

            {topLandingPages.length ===
              0 && (
              <div className="text-sm text-[#69766f]">
                No landing-page data yet.
              </div>
            )}

          </div>

        </div>


        <div>

          <h3 className="font-bold">
            Campaigns
          </h3>

          <div className="mt-4 space-y-3">

            {topCampaigns.map(
              ([
                campaign,
                count,
              ]) => (
                <AnalyticsRow
                  key={
                    campaign
                  }
                  label={
                    campaign
                  }
                  value={
                    count
                  }
                />
              )
            )}

            {topCampaigns.length ===
              0 && (
              <div className="text-sm text-[#69766f]">
                No campaign traffic yet.
              </div>
            )}

          </div>

        </div>

      </div>

        <div className="mt-10">

          <h3 className="font-bold">
            Recent Visits
          </h3>

          <div className="mt-4 overflow-x-auto">

            <table className="w-full text-left text-sm">

              <thead className="bg-[#f3f7f4]">
                <tr>
                  <th className="px-4 py-3">
                    Time
                  </th>

                  <th className="px-4 py-3">
                    Page
                  </th>

                  <th className="px-4 py-3">
                    Source
                  </th>

                  <th className="px-4 py-3">
                    Campaign
                  </th>

                  <th className="px-4 py-3">
                    Referrer
                  </th>
                </tr>
              </thead>


              <tbody>

                {recentVisits.map(
                  (visit, index) => (
                    <tr
                      key={`${visit.created_at}-${index}`}
                      className="border-t border-[#edf1ee]"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(
                          visit.created_at
                        ).toLocaleString(
                          "en-GB"
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {visit.path}
                      </td>

                      <td className="px-4 py-3">
                        {visit.medium
                          ? `${visit.source} / ${visit.medium}`
                          : visit.source}
                      </td>

                      <td className="px-4 py-3">
                        {visit.campaign ||
                          "—"}
                      </td>

                      <td className="px-4 py-3 max-w-[260px] truncate">
                        {visit.referrer ||
                          "Direct"}
                      </td>
                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>

        </div>


        </section>


        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <a
            href="/admin/orders"
            className="rounded-2xl border border-[#dce6df] bg-white p-7 shadow-sm transition hover:border-[#9db9a8]"
          >
            <div className="text-xl font-bold">
              Orders
            </div>

            <p className="mt-3 text-[#607067]">
              View and manage paid translation orders.
            </p>
          </a>


          <a
            href="/admin/enquiries"
            className="rounded-2xl border border-[#dce6df] bg-white p-7 shadow-sm transition hover:border-[#9db9a8]"
          >
            <div className="text-xl font-bold">
              Manual Review Enquiries
            </div>

            <p className="mt-3 text-[#607067]">
              Review complex documents and prepare quotations.
            </p>
          </a>


          <a
            href="/admin/enquiries/new"
            className="rounded-2xl border border-[#dce6df] bg-white p-7 shadow-sm transition hover:border-[#9db9a8]"
          >
            <div className="text-xl font-bold">
              New Manual Enquiry
            </div>

            <p className="mt-3 text-[#607067]">
              Create a quotation and secure payment link for a
              client who contacted you directly.
            </p>
          </a>

          <a
            href="/admin/translators"
            className="rounded-2xl border border-[#dce6df] bg-white p-7 shadow-sm transition hover:border-[#9db9a8]"
          >
            <div className="text-xl font-bold">
              Translators
            </div>

            <p className="mt-3 text-[#607067]">
              Manage translator profiles, language pairs,
              signatures and portal access.
            </p>
          </a>


          <a
            href="/admin/google-ads"
            className="rounded-2xl border border-[#dce6df] bg-white p-7 shadow-sm transition hover:border-[#9db9a8]"
          >
            <div className="text-xl font-bold">Google Ads paid orders</div>
            <p className="mt-3 text-[#607067]">
              Check Google connection and paid-order conversion status.
            </p>
          </a>
          <a
            href="/admin/pricing"
            className="rounded-2xl border border-[#dce6df] bg-white p-7 shadow-sm transition hover:border-[#9db9a8]"
          >
            <div className="text-xl font-bold">
              Pricing
            </div>

            <p className="mt-3 text-[#607067]">
              Manage services, languages, prices and
              turnaround multipliers.
            </p>
          </a>

        </div>

      </div>
    </main>
  );
}

function DashboardCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm">
      <div className="text-sm text-[#65736b]">
        {title}
      </div>

      <div className="mt-2 text-3xl font-bold text-[#087f5b]">
        {value}
      </div>
    </div>
  );
}


function AnalyticsMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-[#f5f8f6] p-5">
      <div className="text-sm text-[#65736b]">
        {label}
      </div>

      <div className="mt-2 text-3xl font-bold text-[#087f5b]">
        {value}
      </div>
    </div>
  );
}


function AnalyticsRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#edf1ee] pb-2 text-sm">
      <span className="min-w-0 truncate text-[#526159]">
        {label}
      </span>

      <strong className="shrink-0">
        {value}
      </strong>
    </div>
  );
}