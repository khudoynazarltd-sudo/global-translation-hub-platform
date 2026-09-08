import type {
  Metadata,
} from "next";

import LegalPageShell, {
  LegalSection,
} from "@/components/LegalPageShell";


export const metadata: Metadata = {
  title:
    "Privacy Policy",

  description:
    "Privacy Policy for GLOBAL TRANSLATION HUB, operated by KHUDOYNAZAR LTD.",

  alternates: {
    canonical:
      "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <LegalPageShell
      title="Privacy Policy"
      description="This notice explains how KHUDOYNAZAR LTD, trading as GLOBAL TRANSLATION HUB, collects, uses and protects personal information."
    >

      <LegalSection title="1. Who we are">
        <p>
          GLOBAL TRANSLATION HUB is a trading name of
          KHUDOYNAZAR LTD, a company registered in
          England and Wales under company number
          16122617.
        </p>

        <p>
          Correspondence address: 6 Lyndewode Road,
          Cambridge, CB1 2HL, United Kingdom.
        </p>
      </LegalSection>


      <LegalSection title="2. Information we collect">
        <p>
          When you request or purchase translation
          services, we may collect your name, email
          address, telephone number, language
          requirements, service requirements,
          communications with us and information
          contained within documents you submit.
        </p>

        <p>
          Documents submitted for translation may
          contain personal information relating to you
          or other individuals. Depending on the
          document, this may include information of a
          sensitive or confidential nature.
        </p>

        <p>
          We also process limited technical information
          relating to use of our website, including
          visited pages, referral source and campaign
          information where available.
        </p>
      </LegalSection>


      <LegalSection title="3. Why we use your information">
        <p>
          We use personal information to provide
          quotations, review documents, perform and
          quality-check translations, administer
          payments, communicate with clients, provide
          secure access to completed work, maintain
          appropriate business records and protect the
          security and integrity of our services.
        </p>
      </LegalSection>


      <LegalSection title="4. Lawful bases">
        <p>
          We primarily process information where this is
          necessary to take steps at your request before
          entering into a contract or to perform a
          contract for translation services.
        </p>

        <p>
          We may also process information where required
          to comply with legal obligations or where
          necessary for legitimate business interests,
          such as service security, fraud prevention,
          record keeping and service improvement,
          provided those interests are not overridden by
          your rights and interests.
        </p>
      </LegalSection>


      <LegalSection title="5. Document confidentiality">
        <p>
          We treat client documents as confidential and
          restrict access to persons who require access
          in order to provide, administer or support the
          requested service.
        </p>

        <p>
          Where an assigned translator or authorised
          service provider requires access to a document,
          access is limited to what is reasonably
          necessary for the relevant purpose.
        </p>
      </LegalSection>


      <LegalSection title="6. Service providers">
        <p>
          We use specialist technology and payment
          providers to operate the service. These may
          include hosting and infrastructure providers,
          secure database and file-storage providers,
          payment processors such as Stripe, and email
          delivery providers such as Resend.
        </p>

        <p>
          These organisations process information only
          where required to provide their respective
          services and subject to their applicable data
          protection obligations.
        </p>
      </LegalSection>


      <LegalSection title="7. International processing">
        <p>
          Some technology providers may process or store
          information outside the United Kingdom. Where
          international transfers of personal data take
          place, we seek to use providers and safeguards
          appropriate to applicable UK data protection
          requirements.
        </p>
      </LegalSection>


      <LegalSection title="8. Payments">
        <p>
          Card payments are processed through Stripe.
          GLOBAL TRANSLATION HUB does not need to store
          your full payment-card details in order to
          process your payment.
        </p>
      </LegalSection>


      <LegalSection title="9. Website analytics">
        <p>
          Our website records limited first-party
          traffic information to help us understand how
          visitors reach and use the site. This can
          include page paths, referral source, campaign
          parameters and a temporary session identifier.
        </p>

        <p>
          We do not use this internal analytics system
          to create sensitive profiles of visitors.
        </p>
      </LegalSection>


      <LegalSection title="10. How long we keep information">
        <p>
          We retain information only for as long as
          reasonably necessary for the purpose for which
          it was collected, including provision of the
          service, handling queries or disputes,
          security, accounting and other legal or
          regulatory requirements.
        </p>

        <p>
          Unpaid or abandoned enquiries and temporary
          uploaded documents may be removed earlier than
          records connected with completed transactions.
          Retention periods may therefore differ
          according to the nature and status of the
          enquiry or order.
        </p>
      </LegalSection>


      <LegalSection title="11. Your rights">
        <p>
          Subject to applicable law, you may have rights
          including access to your personal information,
          correction of inaccurate information,
          erasure, restriction of processing,
          objection to certain processing and data
          portability.
        </p>

        <p>
          Some rights depend on the lawful basis and
          circumstances of the processing and are not
          absolute.
        </p>
      </LegalSection>


      <LegalSection title="12. Complaints">
        <p>
          If you have concerns about how we use personal
          information, please contact GLOBAL TRANSLATION
          HUB first so that we can investigate the
          matter.
        </p>

        <p>
          You also have the right to raise a complaint
          with the UK Information Commissioner&apos;s
          Office where applicable.
        </p>
      </LegalSection>


      <LegalSection title="13. Changes to this policy">
        <p>
          We may update this Privacy Policy where our
          services, technology or legal obligations
          change. The current version will be published
          on this website.
        </p>
      </LegalSection>


      <p className="border-t border-[#e2ebe5] pt-6 text-sm text-[#718078]">
        Last updated: 8 September 2026.
      </p>

    </LegalPageShell>
  );
}