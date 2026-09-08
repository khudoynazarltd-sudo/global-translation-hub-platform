import {
  ReactNode,
} from "react";


export default function LegalPageShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#f8faf8] text-[#13201a]">

      <header className="border-b border-[#dfe8e2] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5">

          <a
            href="/"
            className="min-w-0"
          >
            <div className="text-xl font-bold tracking-wide text-[#087f5b]">
              GLOBAL TRANSLATION HUB
            </div>

            <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[#6b776f]">
              Certified · Legal · Immigration Translations
            </div>
          </a>


          <a
            href="/quote"
            className="shrink-0 rounded-lg bg-[#087f5b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#066a4c]"
          >
            Get a Quote
          </a>

        </div>
      </header>


      <section className="border-b border-[#e3ebe6] bg-gradient-to-br from-white via-[#f7fbf8] to-[#edf7f1]">
        <div className="mx-auto max-w-4xl px-6 py-16">

          <a
            href="/"
            className="text-sm font-semibold text-[#087f5b]"
          >
            ← GLOBAL TRANSLATION HUB
          </a>

          <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl">
            {title}
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#607067]">
            {description}
          </p>

        </div>
      </section>


      <div className="mx-auto max-w-4xl px-6 py-14">

        <article className="rounded-2xl border border-[#dfe8e2] bg-white p-7 shadow-sm md:p-10">

          <div className="space-y-10 leading-7 text-[#536259]">
            {children}
          </div>

        </article>

      </div>


      <footer className="mt-10 bg-[#0c1812] text-[#c8d6ce]">
        <div className="mx-auto max-w-7xl px-6 py-12">

          <div className="text-lg font-bold text-white">
            GLOBAL TRANSLATION HUB
          </div>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm">
            <a href="/privacy" className="hover:text-white">
              Privacy Policy
            </a>

            <a href="/terms" className="hover:text-white">
              Terms & Conditions
            </a>

            <a href="/refunds" className="hover:text-white">
              Cancellation & Refunds
            </a>

            <a href="/contact" className="hover:text-white">
              Contact
            </a>
          </div>

          <div className="mt-7 border-t border-white/10 pt-7 text-sm leading-7">
            <p>
              GLOBAL TRANSLATION HUB is a trading name of KHUDOYNAZAR LTD.
            </p>

            <p>
              Registered in England and Wales. Company No. 16122617.
            </p>

            <p>
              Correspondence address: 6 Lyndewode Road, Cambridge, CB1 2HL, United Kingdom.
            </p>

            <p className="mt-3">
              © 2026 KHUDOYNAZAR LTD. All rights reserved.
            </p>
          </div>

        </div>
      </footer>

    </main>
  );
}


export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-bold text-[#17251e]">
        {title}
      </h2>

      <div className="mt-3 space-y-4">
        {children}
      </div>
    </section>
  );
}