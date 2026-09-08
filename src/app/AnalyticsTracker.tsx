"use client";

import {
  useEffect,
  useRef,
} from "react";

import {
  usePathname,
} from "next/navigation";


type FirstTouch = {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  gclid: string | null;
  fbclid: string | null;
  msclkid: string | null;
};


export default function AnalyticsTracker() {
  const pathname =
    usePathname();

  const lastTracked =
    useRef("");


  useEffect(() => {
    if (
      !pathname ||
      pathname.startsWith(
        "/admin"
      ) ||
      pathname.startsWith(
        "/translator"
      )
    ) {
      return;
    }


    const currentUrl =
      new URL(
        window.location.href
      );


    const trackingKey =
      `${pathname}${currentUrl.search}`;


    /*
      Prevent duplicate tracking during
      React development re-renders.
    */

    if (
      lastTracked.current ===
      trackingKey
    ) {
      return;
    }


    lastTracked.current =
      trackingKey;


    /*
      One identifier for the current
      browser-tab session.
    */

    const sessionStorageKey =
      "gth_analytics_session_id";


    let sessionId =
      window.sessionStorage.getItem(
        sessionStorageKey
      );


    if (!sessionId) {
      sessionId =
        crypto.randomUUID();

      window.sessionStorage.setItem(
        sessionStorageKey,
        sessionId
      );
    }


    /*
      First-touch attribution.

      If the visitor first arrived through
      Google Ads, Facebook, another campaign,
      etc., that original campaign attribution
      remains attached to subsequent page views
      during the same session.
    */

    const attributionStorageKey =
      "gth_analytics_first_touch";


    let attribution:
      FirstTouch;


    const storedAttribution =
      window.sessionStorage.getItem(
        attributionStorageKey
      );


    if (storedAttribution) {
      try {
        attribution =
          JSON.parse(
            storedAttribution
          ) as FirstTouch;
      } catch {
        attribution =
          createFirstTouch(
            currentUrl
          );

        window.sessionStorage.setItem(
          attributionStorageKey,
          JSON.stringify(
            attribution
          )
        );
      }
    } else {
      attribution =
        createFirstTouch(
          currentUrl
        );

      window.sessionStorage.setItem(
        attributionStorageKey,
        JSON.stringify(
          attribution
        )
      );
    }


    const body = {
      sessionId,

      path:
        pathname,

      /*
        Current referrer is intentionally
        retained separately.

        This lets Admin show the actual
        navigation path while source/campaign
        remain first-touch attribution.
      */

      referrer:
        document.referrer ||
        null,

      utmSource:
        attribution.utmSource,

      utmMedium:
        attribution.utmMedium,

      utmCampaign:
        attribution.utmCampaign,

      utmTerm:
        attribution.utmTerm,

      utmContent:
        attribution.utmContent,

      gclid:
        attribution.gclid,

      fbclid:
        attribution.fbclid,

      msclkid:
        attribution.msclkid,
    };


    fetch(
      "/api/analytics/visit",
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            body
          ),

        keepalive:
          true,
      }
    ).catch(() => {
      /*
        Analytics must never interrupt
        the customer workflow.
      */
    });

  }, [
    pathname,
  ]);


  return null;
}


function createFirstTouch(
  currentUrl: URL
): FirstTouch {
  return {
    utmSource:
      currentUrl.searchParams.get(
        "utm_source"
      ),

    utmMedium:
      currentUrl.searchParams.get(
        "utm_medium"
      ),

    utmCampaign:
      currentUrl.searchParams.get(
        "utm_campaign"
      ),

    utmTerm:
      currentUrl.searchParams.get(
        "utm_term"
      ),

    utmContent:
      currentUrl.searchParams.get(
        "utm_content"
      ),

    gclid:
      currentUrl.searchParams.get(
        "gclid"
      ),

    fbclid:
      currentUrl.searchParams.get(
        "fbclid"
      ),

    msclkid:
      currentUrl.searchParams.get(
        "msclkid"
      ),
  };
}