"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Confirmation = {
  ok: boolean;
  confirmed?: boolean;
  orderReady?: boolean;
  orderReference?: string;
  orderStatus?: string;
  paidAt?: string;
  message?: string;
};

function readableStatus(status?: string) {
  if (!status) return "";

  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [confirmation, setConfirmation] =
    useState<Confirmation | null>(null);

  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!sessionId) {
      setConfirmation({
        ok: false,
        message: "Payment session information is missing.",
      });
      setLoading(false);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function checkOrder() {
      try {
        const response = await fetch(
          `/api/payment/confirmation?session_id=${encodeURIComponent(
            sessionId!
          )}`,
          {
            cache: "no-store",
          }
        );

        const data: Confirmation = await response.json();

        if (cancelled) return;

        setConfirmation(data);

        if (
          response.ok &&
          data.ok &&
          data.confirmed &&
          !data.orderReady &&
          attempt < 5
        ) {
          timer = setTimeout(() => {
            setAttempt((current) => current + 1);
          }, 1500);

          return;
        }

        setLoading(false);
      } catch {
        if (!cancelled) {
          setConfirmation({
            ok: false,
            message: "Unable to retrieve your order confirmation.",
          });
          setLoading(false);
        }
      }
    }

    checkOrder();

    return () => {
      cancelled = true;

      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [sessionId, attempt]);

  return (
    <main className="min-h-screen bg-[#f6f9f7] px-6 py-20 text-[#13201a]">
      <div className="mx-auto max-w-2xl rounded-3xl border border-[#dfe8e2] bg-white p-10 shadow-sm">
        {loading ? (
          <>
            <div className="inline-flex rounded-full bg-[#eef4f0] px-4 py-2 text-sm font-semibold text-[#52645a]">
              Confirming Payment
            </div>

            <h1 className="mt-5 text-3xl font-bold">
              We are confirming your order
            </h1>

            <p className="mt-4 leading-7 text-[#607067]">
              Please wait while your secure payment is matched to your
              GLOBAL TRANSLATION HUB order.
            </p>
          </>
        ) : confirmation?.ok &&
          confirmation.confirmed &&
          confirmation.orderReady ? (
          <>
            <div className="inline-flex rounded-full bg-[#eaf8f0] px-4 py-2 text-sm font-semibold text-[#087f5b]">
              Payment Confirmed
            </div>

            <h1 className="mt-5 text-3xl font-bold">
              Thank you. Your order has been created.
            </h1>

            <p className="mt-4 leading-7 text-[#607067]">
              Your payment has been securely confirmed and your translation
              order is now registered with GLOBAL TRANSLATION HUB.
            </p>

            <div className="mt-8 rounded-2xl border border-[#cfe1d6] bg-[#f5faf7] p-6">
              <div className="text-sm font-medium text-[#65736b]">
                Order Reference
              </div>

              <div className="mt-2 text-3xl font-bold tracking-wide text-[#087f5b]">
                {confirmation.orderReference}
              </div>

              <div className="mt-5 text-sm text-[#65736b]">
                Status
              </div>

              <div className="mt-1 font-semibold">
                {readableStatus(confirmation.orderStatus)}
              </div>
            </div>

            <p className="mt-6 text-sm leading-6 text-[#607067]">
              Please keep your order reference for future correspondence.
            </p>
          </>
        ) : confirmation?.confirmed ? (
          <>
            <div className="inline-flex rounded-full bg-[#fff4d8] px-4 py-2 text-sm font-semibold text-[#8a6418]">
              Payment Confirmed
            </div>

            <h1 className="mt-5 text-3xl font-bold">
              Your payment is confirmed
            </h1>

            <p className="mt-4 leading-7 text-[#607067]">
              Your order record is still being finalised. Please refresh this
              page shortly.
            </p>
          </>
        ) : (
          <>
            <div className="inline-flex rounded-full bg-[#fff0ed] px-4 py-2 text-sm font-semibold text-[#9a3f2f]">
              Confirmation Unavailable
            </div>

            <h1 className="mt-5 text-3xl font-bold">
              We could not display your order confirmation
            </h1>

            <p className="mt-4 leading-7 text-[#607067]">
              {confirmation?.message ||
                "Please contact GLOBAL TRANSLATION HUB if you require assistance."}
            </p>
          </>
        )}

        <a
          href="/"
          className="mt-8 inline-block rounded-lg bg-[#087f5b] px-6 py-3 font-semibold text-white"
        >
          Return to Home
        </a>
      </div>
    </main>
  );
}

function PaymentSuccessFallback() {
  return (
    <main className="min-h-screen bg-[#f6f9f7] px-6 py-20 text-[#13201a]">
      <div className="mx-auto max-w-2xl rounded-3xl border border-[#dfe8e2] bg-white p-10 shadow-sm">
        <div className="inline-flex rounded-full bg-[#eef4f0] px-4 py-2 text-sm font-semibold text-[#52645a]">
          Loading
        </div>

        <h1 className="mt-5 text-3xl font-bold">
          Loading payment confirmation
        </h1>

        <p className="mt-4 leading-7 text-[#607067]">
          Please wait while we prepare your order details.
        </p>
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentSuccessFallback />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}