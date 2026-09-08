"use client";

import Script from "next/script";
import {
  useEffect,
  useState,
} from "react";

const GOOGLE_ADS_ID =
  "AW-18438745253";

type ConsentChoice =
  | "accepted"
  | "rejected"
  | null;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (
      command: string,
      ...args: unknown[]
    ) => void;
  }
}

export default function GoogleConsent() {
  const [choice, setChoice] =
    useState<ConsentChoice>(null);

  const [ready, setReady] =
    useState(false);

  useEffect(() => {
    const stored =
      window.localStorage.getItem(
        "gth-google-consent"
      );

    if (
      stored === "accepted" ||
      stored === "rejected"
    ) {
      const granted =
        stored === "accepted"
          ? "granted"
          : "denied";

      window.gtag?.(
        "consent",
        "update",
        {
          ad_storage: granted,
          ad_user_data: granted,
          ad_personalization: granted,
          analytics_storage: granted,
        }
      );

      setChoice(stored);
    }

    setReady(true);
  }, []);

  function updateConsent(
    nextChoice:
      | "accepted"
      | "rejected"
  ) {
    const granted =
      nextChoice === "accepted"
        ? "granted"
        : "denied";

    window.gtag?.(
      "consent",
      "update",
      {
        ad_storage: granted,
        ad_user_data: granted,
        ad_personalization: granted,
        analytics_storage: granted,
      }
    );

    window.localStorage.setItem(
      "gth-google-consent",
      nextChoice
    );

    setChoice(nextChoice);
  }

  return (
    <>
      <Script
        id="google-consent-default"
        strategy="beforeInteractive"
      >
        {`
          window.dataLayer = window.dataLayer || [];

          function gtag(){
            dataLayer.push(arguments);
          }

          window.gtag = gtag;

          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'denied',
            wait_for_update: 500
          });
        `}
      </Script>

      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
        strategy="afterInteractive"
      />

      <Script
        id="google-ads-config"
        strategy="afterInteractive"
      >
        {`
          window.dataLayer = window.dataLayer || [];

          function gtag(){
            dataLayer.push(arguments);
          }

          window.gtag = gtag;

          gtag('js', new Date());
          gtag('config', '${GOOGLE_ADS_ID}');
        `}
      </Script>

      {ready && choice === null && (
        <div className="fixed inset-x-0 bottom-0 z-[100] border-t border-[#d8e2dc] bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-3xl">
              <div className="font-semibold text-[#13201a]">
                Cookies and advertising measurement
              </div>

              <p className="mt-1 text-sm leading-6 text-[#607067]">
                We use optional Google advertising
                measurement technologies to understand
                whether our advertising leads to
                enquiries. You can accept or reject
                these optional technologies.
              </p>

              <a
                href="/privacy"
                className="mt-1 inline-block text-sm font-medium text-[#087f5b] hover:underline"
              >
                Privacy Notice
              </a>
            </div>

            <div className="flex shrink-0 gap-3">
              <button
                type="button"
                onClick={() =>
                  updateConsent("rejected")
                }
                className="rounded-lg border border-[#b9c8bf] px-5 py-3 text-sm font-semibold text-[#26382e]"
              >
                Reject
              </button>

              <button
                type="button"
                onClick={() =>
                  updateConsent("accepted")
                }
                className="rounded-lg bg-[#087f5b] px-5 py-3 text-sm font-semibold text-white"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}