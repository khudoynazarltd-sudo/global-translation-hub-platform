import type {
  Metadata,
} from "next";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";


export const metadata: Metadata = {
  alternates: {
    canonical:
      "/",
  },

  openGraph: {
    url:
      "/",
  },
};


export default async function Home() {
  const {
    data: services,
  } =
    await supabaseAdmin
      .from("service_types")
      .select(`
        id,
        name,
        base_price,
        manual_review,
        active
      `)
      .eq(
        "active",
        true
      )
      .order(
        "name",
        {
          ascending: true,
        }
      );


  const serviceMap =
    new Map(
      (services ?? []).map(
        (service) => [
          service.name,
          service,
        ]
      )
    );


  function servicePrice(
    serviceName: string
  ) {
    const service =
      serviceMap.get(
        serviceName
      );


    if (
      !service ||
      service.manual_review ||
      service.base_price === null
    ) {
      return "Individual quotation";
    }


    return `from £${Number(
      service.base_price
    ).toFixed(0)}`;
  }


  return (
    <main className="min-h-screen bg-[#f8faf8] text-[#13201a]">
      <header className="border-b border-[#dfe8e2] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <div className="text-xl font-bold tracking-wide text-[#087f5b]">
              GLOBAL TRANSLATION HUB
            </div>
            <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[#6b776f]">
              Certified · Legal · Immigration Translations
            </div>
          </div>

          <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
            <a href="#services" className="transition hover:text-[#087f5b]">
              Services
            </a>
            <a href="#languages" className="transition hover:text-[#087f5b]">
              Languages
            </a>
            <a href="#pricing" className="transition hover:text-[#087f5b]">
              Pricing
            </a>
            <a href="#solicitors" className="transition hover:text-[#087f5b]">
              For Solicitors
            </a>
            <a href="#about" className="transition hover:text-[#087f5b]">
              About
            </a>
          </nav>

          <a
            href="/quote"
            className="rounded-lg bg-[#087f5b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#066a4c]"
          >
            Get a Quote
          </a>
        </div>
      </header>

      <section className="border-b border-[#e3ebe6] bg-gradient-to-br from-white via-[#f7fbf8] to-[#edf7f1]">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-[#cfe4d8] bg-white px-4 py-2 text-sm font-semibold text-[#087f5b]">
              Professional Translation Services in the United Kingdom
            </div>

            <h1 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight text-[#102018] md:text-6xl">
              Certified, Legal & Immigration Translations
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#536259]">
              Professional document translation services for individuals,
              solicitors and businesses across the United Kingdom. Securely
              upload your documents, receive a clear quotation and track your
              translation from submission to completion.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <a
                href="/quote"
                className="rounded-lg bg-[#087f5b] px-6 py-4 font-semibold text-white transition hover:bg-[#066a4c]"
              >
                Get a Quote
              </a>

              <a
                href="#solicitors"
                className="rounded-lg border border-[#b9c9bf] bg-white px-6 py-4 font-semibold text-[#173025] transition hover:border-[#087f5b]"
              >
                For Solicitors & Businesses
              </a>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-8 gap-y-3 text-sm text-[#617068]">
              <span>✓ Secure document upload</span>
              <span>✓ Clear quotations</span>
              <span>✓ Professional quality control</span>
            </div>
          </div>

          <div className="rounded-3xl border border-[#dce8e0] bg-white p-8 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#087f5b]">
              How it works
            </div>

            <div className="mt-7 space-y-6">
              {[
                [
                  "01",
                  "Upload your document",
                  "Send a clear PDF, scan or photograph through our secure upload process.",
                ],
                [
                  "02",
                  "Receive your quotation",
                  "Standard documents may receive an immediate quotation. Complex documents are reviewed manually.",
                ],
                [
                  "03",
                  "Approve and pay",
                  "Review the confirmed price and turnaround time before payment.",
                ],
                [
                  "04",
                  "Translation & quality check",
                  "Your document is professionally translated and reviewed before completion.",
                ],
                [
                  "05",
                  "Secure delivery",
                  "Receive your completed translation and applicable certification documents securely.",
                ],
              ].map(([number, title, description]) => (
                <div key={number} className="flex gap-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eef8f2] font-bold text-[#087f5b]">
                    {number}
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#17251e]">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-[#617068]">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-3xl">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#087f5b]">
            Services
          </div>
          <h2 className="mt-3 text-4xl font-bold tracking-tight">
            Professional translation for official and legal purposes
          </h2>
          <p className="mt-5 text-lg leading-8 text-[#5e6c64]">
            GLOBAL TRANSLATION HUB provides carefully managed translation
            services for documents requiring accuracy, consistency and clear
            professional presentation.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Certified Translations",
              text: "Certified translations of official documents including birth certificates, marriage certificates, police certificates, diplomas and other supporting documentation.",
            },
            {
              title: "Immigration Translations",
              text: "Professional translation of supporting documentation for UK immigration, nationality, settlement and related applications.",
            },
            {
              title: "Legal Translations",
              text: "Translation of court documents, witness statements, legal correspondence, powers of attorney, contracts and case documentation.",
            },
          ].map((service) => (
            <article
              key={service.title}
              className="rounded-2xl border border-[#dde8e1] bg-white p-7 shadow-sm"
            >
              <h3 className="text-xl font-bold">{service.title}</h3>
              <p className="mt-4 leading-7 text-[#607067]">{service.text}</p>
              <a
                href="/quote?service=document"
                className="mt-7 inline-block font-semibold text-[#087f5b]"
              >
                Request a quotation →
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#e2ebe5] bg-[#f4f9f6]">
        <div className="mx-auto max-w-7xl px-6 py-20">

          <div className="max-w-3xl">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#087f5b]">
              Audio & Video Translation
            </div>

            <h2 className="mt-3 text-4xl font-bold tracking-tight">
              Professional translation of audio and video content
            </h2>

            <p className="mt-5 text-lg leading-8 text-[#5e6c64]">
              GLOBAL TRANSLATION HUB also provides professional translation
              services for audio and video materials. Each assignment is reviewed
              individually according to the language pair, recording quality,
              duration, subject matter and required final format.
            </p>
          </div>


          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">

            <article className="rounded-2xl border border-[#dce8e0] bg-white p-7 shadow-sm">
              <h3 className="text-xl font-bold">
                Written Transcript & Certified Translation
              </h3>

              <p className="mt-4 leading-7 text-[#607067]">
                We can prepare a complete written transcript of the spoken content
                and provide the translated text as a professionally formatted
                document. Where appropriate, certification can also be provided for
                the completed written translation.
              </p>
            </article>


            <article className="rounded-2xl border border-[#dce8e0] bg-white p-7 shadow-sm">
              <h3 className="text-xl font-bold">
                Translation Overlay / Voiceover
              </h3>

              <p className="mt-4 leading-7 text-[#607067]">
                Where required, translated audio may be prepared for overlay or
                voiceover use. The scope, timing and technical format are agreed
                individually before work begins.
              </p>
            </article>


            <article className="rounded-2xl border border-[#dce8e0] bg-white p-7 shadow-sm">
              <h3 className="text-xl font-bold">
                Subtitles
              </h3>

              <p className="mt-4 leading-7 text-[#607067]">
                We can provide translated subtitles for video content, including
                subtitle text prepared for use with common subtitle formats where
                required.
              </p>
            </article>

          </div>


          <div className="mt-8 rounded-2xl border border-[#cfe4d8] bg-white p-6">
            <p className="leading-7 text-[#536259]">
              Audio and video translation is quoted individually. Please provide
              details of the file duration, language pair, content type and the
              required output format when requesting a quotation.
            </p>

            <a
              href="/quote?service=audio-video"
              className="mt-5 inline-block rounded-lg bg-[#087f5b] px-6 py-3 font-semibold text-white transition hover:bg-[#066a4c]"
            >
              Request an Audio / Video Quote
            </a>
          </div>

        </div>
      </section>


      <section
        id="languages"
        className="border-y border-[#e2ebe5] bg-white"
      >
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#087f5b]">
                Languages
              </div>
              <h2 className="mt-3 text-4xl font-bold">Languages at launch</h2>
              <p className="mt-5 leading-8 text-[#607067]">
                Availability depends upon language direction, document type,
                complexity and required turnaround time.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {["English", "Russian", "Tajik", "Chinese"].map((language) => (
                <div
                  key={language}
                  className="rounded-xl border border-[#dfe9e2] bg-[#f8fbf9] px-5 py-5 font-semibold"
                >
                  {language}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#087f5b]">
              Pricing
            </div>

            <h2 className="mt-3 text-4xl font-bold">
              Clear pricing before you proceed
            </h2>

            <p className="mt-5 leading-8 text-[#607067]">
              Standard documents may qualify for fixed pricing. Legal,
              medical, court and complex documents are reviewed individually
              before a final quotation is confirmed.
            </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">

          <div className="rounded-xl border border-[#dfe8e2] bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.14em] text-[#087f5b]">
              Standard
            </div>

            <div className="mt-2 text-lg font-bold text-[#17251e]">
              Up to 3 working days
            </div>
          </div>


          <div className="rounded-xl border border-[#dfe8e2] bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.14em] text-[#087f5b]">
              Priority
            </div>

            <div className="mt-2 text-lg font-bold text-[#17251e]">
              Approximately 1.5–2 working days
            </div>
          </div>


          <div className="rounded-xl border border-[#dfe8e2] bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.14em] text-[#087f5b]">
              Urgent
            </div>

            <div className="mt-2 text-lg font-bold text-[#17251e]">
              Within 1 working day
            </div>
          </div>

        </div>

          <p className="mt-4 text-sm leading-6 text-[#6b776f]">
            Turnaround times are subject to document complexity, language pair and availability.
          </p>

          </div>

          <div className="overflow-hidden rounded-2xl border border-[#dfe8e2] bg-white">
            {[
              [
                "Birth Certificate",
                servicePrice(
                  "Birth Certificate"
                ),
              ],

              [
                "Marriage Certificate",
                servicePrice(
                  "Marriage Certificate"
                ),
              ],

              [
                "Police Certificate",
                servicePrice(
                  "Police Certificate"
                ),
              ],

              [
                "Passport",
                servicePrice(
                  "Passport"
                ),
              ],

              [
                "Diploma",
                servicePrice(
                  "Diploma"
                ),
              ],

              [
                "Summons",
                servicePrice(
                  "Summons"
                ),
              ],

              [
                "Legal / complex document",
                "Individual quotation",
              ],
            ].map(([service, price], index) => (
              <div
                key={service}
                className={`flex items-center justify-between gap-5 px-6 py-5 ${
                  index !== 6
                    ? "border-b border-[#edf1ee]"
                    : ""
                }`}
              >
                <span>{service}</span>
                <strong className="text-right text-[#087f5b]">{price}</strong>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 text-sm leading-6 text-[#6b776f]">
          Prices shown are indicative starting prices and do not constitute a
          binding quotation until confirmed by GLOBAL TRANSLATION HUB.
        </p>
      </section>

      <section
        id="solicitors"
        className="bg-[#102b20] text-white"
      >
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7fe0b4]">
              Solicitors & Professional Clients
            </div>

            <h2 className="mt-4 text-4xl font-bold">
              Professional translation support for legal practices
            </h2>

            <p className="mt-5 max-w-2xl leading-8 text-[#ccddd3]">
              Translation support for solicitors, law firms and professional
              organisations requiring reliable handling of legal,
              immigration and supporting documentation.
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/5 p-8">
            <ul className="space-y-4 text-[#e5f0e9]">
              <li>✓ Certified document translation</li>
              <li>✓ Legal and court documentation</li>
              <li>✓ Immigration case documents</li>
              <li>✓ Confidential document handling</li>
              <li>✓ Urgent assignments subject to availability</li>
            </ul>

            <a
              href="/quote"
              className="mt-8 inline-block rounded-lg bg-white px-6 py-4 font-semibold text-[#102b20]"
            >
              Request a Professional Quote
            </a>
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#087f5b]">
              Professional Standards
            </div>
            <h2 className="mt-3 text-4xl font-bold">About our service</h2>
          </div>

          <div className="space-y-5 leading-8 text-[#607067]">
            <p>
              GLOBAL TRANSLATION HUB is a professional translation service
              operated by KHUDOYNAZAR LTD, a company registered in England and
              Wales.
            </p>

            <p>
              Translation services are led by{" "}
              <strong className="text-[#1b2922]">
                Dr Zulfiyor Bakhtiyorov ACIL
              </strong>
              , Associate Member of the Chartered Institute of Linguists
              (CIOL).
            </p>

            <p>
              Our approach focuses on accuracy, confidentiality, clear
              communication, professional quality control and careful handling
              of official and legal documentation.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-[#e2ebe5] bg-[#f1f8f4]">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <h2 className="text-4xl font-bold">Ready to request a translation?</h2>
          <p className="mx-auto mt-5 max-w-2xl leading-8 text-[#607067]">
            Upload your document securely and receive a quotation before
            proceeding.
          </p>

          <a
            href="/quote"
            className="mt-8 inline-block rounded-lg bg-[#087f5b] px-7 py-4 font-semibold text-white"
          >
            Get a Quote
          </a>
        </div>
      </section>

      <footer className="bg-[#0c1812] text-[#c8d6ce]">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="text-xl font-bold text-white">
            GLOBAL TRANSLATION HUB
          </div>

          <p className="mt-3 max-w-xl text-sm leading-6">
            Certified · Legal · Immigration Translations
          </p>

        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm">
          <a
            href="/privacy"
            className="transition hover:text-white"
          >
            Privacy Policy
          </a>

          <a
            href="/terms"
            className="transition hover:text-white"
          >
            Terms & Conditions
          </a>

          <a
            href="/refunds"
            className="transition hover:text-white"
          >
            Cancellation & Refunds
          </a>

          <a
            href="/contact"
            className="transition hover:text-white"
          >
            Contact
          </a>
        </div>

          <div className="mt-9 border-t border-white/10 pt-8 text-sm leading-7">
            <p>
              GLOBAL TRANSLATION HUB is a trading name of KHUDOYNAZAR LTD.
            </p>
            <p>
              Registered in England and Wales. Company No. 16122617.
            </p>
            <p>
              Correspondence address: 6 Lyndewode Road, Cambridge, CB1 2HL,
              United Kingdom.
            </p>
            <p className="mt-4">
              © 2026 KHUDOYNAZAR LTD. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}