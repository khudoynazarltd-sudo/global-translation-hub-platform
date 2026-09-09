import { publicMetadata } from "@/lib/seo/metadata";
import type {
  Metadata,
} from "next";

import LegalPageShell, {
  LegalSection,
} from "@/components/LegalPageShell";


export const metadata: Metadata = publicMetadata("Contact", "Contact GLOBAL TRANSLATION HUB, operated by KHUDOYNAZAR LTD in Cambridge, United Kingdom.", "/contact");

export default function ContactPage() {
  return (
    <LegalPageShell
      title="Contact GLOBAL TRANSLATION HUB"
      description="Contact us regarding a quotation, existing translation order or professional translation requirement."
    >

      <LegalSection title="Company">
        <p className="font-semibold text-[#17251e]">
          KHUDOYNAZAR LTD
        </p>

        <p>
          Trading as GLOBAL TRANSLATION HUB
        </p>

        <p>
          Registered in England and Wales.
          <br />
          Company No. 16122617.
        </p>
      </LegalSection>


      <LegalSection title="Correspondence address">
        <address className="not-italic">
          6 Lyndewode Road
          <br />
          Cambridge
          <br />
          CB1 2HL
          <br />
          United Kingdom
        </address>
      </LegalSection>


      <LegalSection title="Translation enquiries">
        <p>
          The quickest way to request a translation is
          through our secure quotation system.
        </p>

        <p>
          <a
            href="/quote"
            className="inline-flex rounded-lg bg-[#087f5b] px-5 py-3 font-semibold text-white"
          >
            Request a Translation Quote
          </a>
        </p>
      </LegalSection>


      <LegalSection title="Existing orders">
        <p>
          If you already have a GLOBAL TRANSLATION HUB
          order, please quote your GTH order reference
          when contacting us about the service.
        </p>
      </LegalSection>


      <LegalSection title="Professional clients">
        <p>
          Solicitors, law firms, businesses and other
          professional organisations may contact us
          regarding recurring or case-specific
          translation requirements.
        </p>
      </LegalSection>

    </LegalPageShell>
  );
}