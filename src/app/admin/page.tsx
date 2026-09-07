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
