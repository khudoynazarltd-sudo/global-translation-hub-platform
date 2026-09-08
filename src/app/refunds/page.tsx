import type {
  Metadata,
} from "next";

import LegalPageShell, {
  LegalSection,
} from "@/components/LegalPageShell";


export const metadata: Metadata = {
  title:
    "Cancellation & Refund Policy",

  description:
    "Cancellation and Refund Policy for GLOBAL TRANSLATION HUB.",

  alternates: {
    canonical:
      "/refunds",
  },
};

export default function RefundsPage() {
  return (
    <LegalPageShell
      title="Cancellation & Refund Policy"
      description="This policy explains how cancellation and refund requests are handled for translation services."
    >

      <LegalSection title="1. Before payment">
        <p>
          You are under no obligation to proceed merely
          because you request a quotation. If you do not
          accept and pay the quotation, translation work
          will ordinarily not begin.
        </p>
      </LegalSection>


      <LegalSection title="2. After payment but before work begins">
        <p>
          If you wish to cancel after payment, contact us
          as soon as possible. Where work has not begun
          and no non-recoverable cost has been incurred,
          we will consider the applicable statutory
          cancellation rights and circumstances of the
          order.
        </p>
      </LegalSection>


      <LegalSection title="3. Services started during a cancellation period">
        <p>
          Where applicable consumer law gives you a
          cancellation period and you expressly ask us
          to begin providing the translation during that
          period, you may be required to pay an amount
          proportionate to the service already supplied
          if you subsequently cancel.
        </p>
      </LegalSection>


      <LegalSection title="4. Completed services">
        <p>
          Where a service has been fully performed after
          the customer&apos;s valid request for
          performance to begin during the cancellation
          period and the applicable legal requirements
          have been satisfied, statutory cancellation
          rights may cease to apply.
        </p>
      </LegalSection>


      <LegalSection title="5. Errors or service problems">
        <p>
          If a translation has not been supplied with
          reasonable care and skill, applicable consumer
          law may provide remedies including repeat
          performance or an appropriate price reduction.
        </p>

        <p>
          Please contact us promptly with details of the
          issue so that we can investigate and, where
          appropriate, correct the work.
        </p>
      </LegalSection>


      <LegalSection title="6. Changes requested by the client">
        <p>
          Changes to source documents or instructions
          after work begins may require a revised
          quotation or additional charge. They may also
          affect the expected turnaround time.
        </p>
      </LegalSection>


      <LegalSection title="7. Refund method">
        <p>
          Where a refund is due, it will ordinarily be
          made to the original payment method, subject
          to applicable law and payment-provider
          processing arrangements.
        </p>
      </LegalSection>


      <LegalSection title="8. How to request cancellation or a refund">
        <p>
          Contact GLOBAL TRANSLATION HUB and provide
          your name, order reference where one has been
          issued, and an explanation of your request.
        </p>

        <p>
          We will review the request according to the
          status of the service and applicable consumer
          rights.
        </p>
      </LegalSection>


      <p className="border-t border-[#e2ebe5] pt-6 text-sm text-[#718078]">
        Last updated: 8 September 2026.
      </p>

    </LegalPageShell>
  );
}