export default function PaymentCancelledPage() {
  return (
    <main className="min-h-screen bg-[#f6f9f7] px-6 py-20 text-[#13201a]">
      <div className="mx-auto max-w-2xl rounded-3xl border border-[#dfe8e2] bg-white p-10 shadow-sm">
        <div className="inline-flex rounded-full bg-[#fff4d8] px-4 py-2 text-sm font-semibold text-[#8a6418]">
          Payment Not Completed
        </div>

        <h1 className="mt-5 text-3xl font-bold">
          Your payment was not completed
        </h1>

        <p className="mt-4 leading-7 text-[#607067]">
          No GLOBAL TRANSLATION HUB order reference has been created.
        </p>

        <p className="mt-4 leading-7 text-[#607067]">
          Your uploaded document remains temporarily stored and will be
          deleted automatically if the quotation is not completed within the
          temporary retention period.
        </p>

        <a
          href="/quote"
          className="mt-8 inline-block rounded-lg bg-[#087f5b] px-6 py-3 font-semibold text-white"
        >
          Return to Quote
        </a>
      </div>
    </main>
  );
}