import type {
  Metadata,
} from "next";

import LegalPageShell, {
  LegalSection,
} from "@/components/LegalPageShell";


export const metadata: Metadata = {
  title:
    "Terms & Conditions",

  description:
    "Terms and Conditions for GLOBAL TRANSLATION HUB translation services.",

  alternates: {
    canonical:
      "/terms",
  },
};

export default function TermsPage() {
  return (
    <LegalPageShell
      title="Terms & Conditions"
      description="These terms apply to translation services supplied by KHUDOYNAZAR LTD trading as GLOBAL TRANSLATION HUB."
    >

      <LegalSection title="1. Our service">
        <p>
          GLOBAL TRANSLATION HUB provides professional
          translation and associated certification
          services for individuals, businesses and
          professional clients.
        </p>

        <p>
          Acceptance of a translation by a particular
          public authority, court, educational
          institution, employer or other organisation
          ultimately remains subject to that
          organisation&apos;s own requirements and
          discretion.
        </p>
      </LegalSection>


      <LegalSection title="2. Quotations">
        <p>
          Prices displayed before document review may be
          indicative. A quotation becomes confirmed when
          GLOBAL TRANSLATION HUB confirms the applicable
          price for the submitted work.
        </p>

        <p>
          We may require manual review where a document
          is complex, lengthy, unusual, unclear or
          otherwise unsuitable for automatic pricing.
        </p>
      </LegalSection>


      <LegalSection title="3. Formation of the contract">
        <p>
          A contract for paid translation services is
          formed when payment for an agreed quotation is
          successfully completed, unless we expressly
          agree otherwise in writing.
        </p>
      </LegalSection>


      <LegalSection title="4. Client responsibilities">
        <p>
          You must provide documents that are sufficiently
          clear and complete for translation and provide
          accurate instructions about the required
          language direction, purpose and any relevant
          requirements.
        </p>

        <p>
          You confirm that you are entitled to submit
          the documents and personal information you
          provide to us for the requested service.
        </p>
      </LegalSection>


      <LegalSection title="5. Turnaround">
        <p>
          Turnaround periods are estimates or agreed
          service periods based on the information and
          documents available at the time of quotation.
        </p>

        <p>
          Urgent and priority services are subject to
          availability. Delays caused by incomplete,
          illegible or subsequently amended source
          material may affect the agreed completion
          time.
        </p>
      </LegalSection>


      <LegalSection title="6. Translation standards">
        <p>
          Translation services will be provided with
          reasonable care and skill. We do not knowingly
          reconstruct information that cannot be
          reliably read from the supplied source
          material.
        </p>

        <p>
          Where relevant, unclear or illegible material
          may be identified as such in the translation.
        </p>
      </LegalSection>


      <LegalSection title="7. Client review and corrections">
        <p>
          If you believe that a completed translation
          contains an error attributable to our service,
          please notify us promptly and provide
          sufficient information for us to review the
          matter.
        </p>

        <p>
          Nothing in these Terms limits any statutory
          rights that cannot lawfully be excluded.
        </p>
      </LegalSection>


      <LegalSection title="8. Certification">
        <p>
          Where certification is included in the
          purchased service, the certification relates
          to the translation supplied and the information
          available to us.
        </p>

        <p>
          GLOBAL TRANSLATION HUB does not represent that
          it is an approval authority for the Home
          Office, UKVI, courts or other public bodies.
        </p>
      </LegalSection>


      <LegalSection title="9. Confidentiality">
        <p>
          Client documents and information are handled
          confidentially and access is limited to
          persons reasonably requiring access for the
          provision or administration of the service.
        </p>
      </LegalSection>


      <LegalSection title="10. Payment">
        <p>
          Unless agreed otherwise, payment is required
          before translation work begins. Payment is
          processed securely through the payment
          provider made available during checkout.
        </p>
      </LegalSection>


      <LegalSection title="11. Cancellation">
        <p>
          Consumer cancellation rights depend on the
          circumstances and applicable law. Where you
          ask us to begin a service during a statutory
          cancellation period, this may affect the
          amount refundable if you later cancel.
        </p>

        <p>
          Further details are set out in our
          Cancellation & Refund Policy.
        </p>
      </LegalSection>


      <LegalSection title="12. Liability">
        <p>
          Nothing in these Terms excludes or restricts
          liability where doing so would be unlawful.
        </p>

        <p>
          We are not responsible for consequences
          resulting from inaccurate or incomplete
          instructions supplied by the client, defects
          in source material, or requirements imposed by
          a third-party recipient that were not disclosed
          to us before the service was agreed.
        </p>
      </LegalSection>


      <LegalSection title="13. Governing law">
        <p>
          These Terms are governed by the laws of
          England and Wales, subject to any mandatory
          consumer protections that apply to you.
        </p>
      </LegalSection>


      <p className="border-t border-[#e2ebe5] pt-6 text-sm text-[#718078]">
        Last updated: 8 September 2026.
      </p>

    </LegalPageShell>
  );
}