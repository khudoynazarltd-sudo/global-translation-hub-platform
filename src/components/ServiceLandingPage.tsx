import LegalPageShell, { LegalSection } from "@/components/LegalPageShell";
import { servicePages } from "@/lib/seo/services";
import { siteUrl } from "@/lib/seo/metadata";
export default function ServiceLandingPage({slug}: {slug: string}) {
 const page = servicePages.find(p => p.slug === slug)!;
 const quote = slug === "audio-video-translation" ? "/quote?service=audio-video" : "/quote?service=document";
 const breadcrumb = {"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Home",item:siteUrl+"/"},{"@type":"ListItem",position:2,name:page.title,item:siteUrl+"/"+page.slug}]};
 return <LegalPageShell title={page.title} description={page.intro}>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(breadcrumb).replace(/</g,"\\u003c")}} />
  <nav aria-label="Breadcrumb" className="text-sm"><a href="/" className="underline">Home</a><span aria-hidden="true"> / </span><span aria-current="page">{page.title}</span></nav>
  <a href={quote} className="inline-block rounded-lg bg-[#087f5b] px-5 py-3 font-semibold text-white">Request a translation quote</a>
  {page.sections.map(([title,text])=><LegalSection key={title} title={title}><p>{text}</p></LegalSection>)}
  <LegalSection title="From enquiry to delivery"><ol className="list-decimal space-y-2 pl-6"><li>Upload the material and explain its intended use and your deadline.</li><li>Review the quotation, confirmed scope and turnaround.</li><li>Approve and pay through the secure payment process.</li><li>The translation is prepared and reviewed before secure delivery.</li></ol></LegalSection>
  <LegalSection title="Frequently asked questions">{page.faqs.map(([q,a])=><div key={q} className="mt-5"><h3 className="font-semibold text-[#17251e]">{q}</h3><p>{a}</p></div>)}</LegalSection>
  <LegalSection title="Related translation services"><nav aria-label="Related services"><ul className="space-y-2">{servicePages.filter(p=>p.slug!==slug).map(p=><li key={p.slug}><a className="underline" href={"/"+p.slug}>{p.title}</a></li>)}</ul></nav></LegalSection>
  <p>GLOBAL TRANSLATION HUB is operated by KHUDOYNAZAR LTD, registered in England and Wales, company number 16122617. <a className="underline" href="/contact">Contact us</a> about your requirements, or <a className="underline" href={quote}>request a quotation</a>.</p>
 </LegalPageShell>;
}
