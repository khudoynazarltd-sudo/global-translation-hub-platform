"use client";

import { useMemo, useState } from "react";

type Step =
  | "upload"
  | "language"
  | "document"
  | "purpose"
  | "turnaround"
  | "contact"
  | "review"
  | "result";

const languages = [
  "English",
  "Russian",
  "Tajik",
  "Chinese",
  "Other",
  "Not sure",
];

const targetLanguages = ["English", "Russian", "Tajik", "Chinese"];

const documentTypes = [
  "Birth Certificate",
  "Marriage Certificate",
  "Police Certificate",
  "Passport / ID",
  "Diploma / Academic Certificate",
  "Academic Transcript",
  "Legal Document",
  "Court Document",
  "Medical Document",
  "Business Document",
  "Other",
];

const purposes = [
  "UK Immigration / Visa",
  "Legal Matter",
  "Court Proceedings",
  "Education",
  "Employment",
  "Business",
  "Personal",
  "Other",
];

const turnaroundOptions = ["Standard", "Priority", "Urgent"];

type SubmissionResult = {
  ok: boolean;
  enquiryId?: string;
  requiresManualReview?: boolean;
  amount?: number | null;
  currency?: string;
  expiresAt?: string;
  message?: string;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(value);
}

export default function QuotePage() {
  const [step, setStep] = useState<Step>("upload");

  const [file, setFile] = useState<File | null>(null);

  const [sourceLanguage, setSourceLanguage] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("English");
  const [documentType, setDocumentType] = useState("");
  const [purpose, setPurpose] = useState("");
  const [turnaround, setTurnaround] = useState("Standard");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");

  const [authorised, setAuthorised] = useState(false);
  const [authenticityAccepted, setAuthenticityAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [result, setResult] = useState<SubmissionResult | null>(null);

  const sourceAndTargetAreSame =
    sourceLanguage !== "" &&
    sourceLanguage === targetLanguage;

  const canSubmit = useMemo(() => {
    return (
      file !== null &&
      fullName.trim() !== "" &&
      email.trim() !== "" &&
      sourceLanguage !== "" &&
      targetLanguage !== "" &&
      documentType !== "" &&
      purpose !== "" &&
      turnaround !== "" &&
      !sourceAndTargetAreSame &&
      authorised &&
      authenticityAccepted &&
      termsAccepted
    );
  }, [
    file,
    fullName,
    email,
    sourceLanguage,
    targetLanguage,
    documentType,
    purpose,
    turnaround,
    sourceAndTargetAreSame,
    authorised,
    authenticityAccepted,
    termsAccepted,
  ]);

  function goTo(nextStep: Step) {
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function restart() {
    setStep("upload");
    setFile(null);
    setSourceLanguage("");
    setTargetLanguage("English");
    setDocumentType("");
    setPurpose("");
    setTurnaround("Standard");
    setFullName("");
    setEmail("");
    setTelephone("");
    setAuthorised(false);
    setAuthenticityAccepted(false);
    setTermsAccepted(false);
    setSubmitting(false);
    setSubmissionError("");
    setResult(null);
  }

  async function submitEnquiry() {
    if (!canSubmit || !file) return;
  
    setSubmitting(true);
    setSubmissionError("");
  
    try {
      const formData = new FormData();
  
      formData.append("file", file);
      formData.append("fullName", fullName.trim());
      formData.append("email", email.trim());
      formData.append("telephone", telephone.trim());
      formData.append("sourceLanguage", sourceLanguage);
      formData.append("targetLanguage", targetLanguage);
      formData.append("documentType", documentType);
      formData.append("purpose", purpose);
      formData.append("turnaround", turnaround);
  
      const response = await fetch("/api/enquiries", {
        method: "POST",
        body: formData,
      });
  
      const data: SubmissionResult = await response.json();
  
      if (!response.ok || !data.ok) {
        throw new Error(
          data.message || "Unable to submit your translation enquiry."
        );
      }
  
      setResult(data);
      goTo("result");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to submit your translation enquiry.";
  
      setSubmissionError(message);
    } finally {
      setSubmitting(false);
    }
  }
  
  async function proceedToPayment() {
    if (!result?.enquiryId) return;
  
    try {
      setSubmitting(true);
      setSubmissionError("");
  
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enquiryId: result.enquiryId,
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok || !data.ok || !data.checkoutUrl) {
        throw new Error(
          data.message || "Unable to open secure payment."
        );
      }
  
      window.location.href = data.checkoutUrl;
    } catch (error) {
      setSubmissionError(
        error instanceof Error
          ? error.message
          : "Unable to open secure payment."
      );
    } finally {
      setSubmitting(false);
    }
  }
  
  return (
  
    <main className="min-h-screen bg-[#f6f9f7] text-[#13201a]">
      <header className="border-b border-[#dfe8e2] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <a href="/" className="font-bold tracking-wide text-[#087f5b]">
            GLOBAL TRANSLATION HUB
          </a>

          <a
            href="/"
            className="text-sm font-medium text-[#536259] hover:text-[#087f5b]"
          >
            Return to Home
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-14">
        <div className="mb-10">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#087f5b]">
            Secure Translation Enquiry
          </div>

          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            Get a Translation Quote
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-[#607067]">
            Provide your document details, review your information and submit
            your enquiry securely.
          </p>
        </div>

        <div className="mb-8 flex gap-2">
          {[
            "upload",
            "language",
            "document",
            "purpose",
            "turnaround",
            "contact",
            "review",
            "result",
          ].map((item, index) => {
            const order = [
              "upload",
              "language",
              "document",
              "purpose",
              "turnaround",
              "contact",
              "review",
              "result",
            ];

            return (
              <div
                key={item}
                className={`h-2 flex-1 rounded-full ${
                  order.indexOf(step) >= index
                    ? "bg-[#087f5b]"
                    : "bg-[#dfe8e2]"
                }`}
              />
            );
          })}
        </div>

        <section className="rounded-3xl border border-[#dfe8e2] bg-white p-7 shadow-sm md:p-10">
          {step === "upload" && (
            <>
              <h2 className="text-2xl font-bold">Upload your document</h2>

              <p className="mt-3 leading-7 text-[#607067]">
                Your file will not be uploaded until you complete the review
                step and submit the enquiry.
              </p>

              <label className="mt-8 block cursor-pointer rounded-2xl border-2 border-dashed border-[#bed2c5] bg-[#f8fbf9] p-10 text-center transition hover:border-[#087f5b]">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(event) => {
                    const selected = event.target.files?.[0] ?? null;
                    setFile(selected);
                  }}
                />

                <div className="text-lg font-semibold text-[#173025]">
                  Choose PDF, JPG, JPEG or PNG
                </div>

                <p className="mt-2 text-sm text-[#69766f]">
                  Maximum file size: 15 MB.
                </p>
              </label>

              {file && (
                <div className="mt-5 rounded-xl bg-[#eef8f2] px-5 py-4 text-sm">
                  Selected file: <strong>{file.name}</strong>
                </div>
              )}

              <button
                disabled={!file}
                onClick={() => goTo("language")}
                className="mt-8 rounded-lg bg-[#087f5b] px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue
              </button>
            </>
          )}

          {step === "language" && (
            <>
              <h2 className="text-2xl font-bold">Language details</h2>

              <p className="mt-3 text-[#607067]">
                What language is the source document written in?
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {languages.map((language) => (
                  <button
                    key={language}
                    onClick={() => setSourceLanguage(language)}
                    className={`rounded-xl border px-5 py-4 text-left font-medium ${
                      sourceLanguage === language
                        ? "border-[#087f5b] bg-[#eef8f2] text-[#087f5b]"
                        : "border-[#dce6df] hover:border-[#9db9a8]"
                    }`}
                  >
                    {language}
                  </button>
                ))}
              </div>

              <div className="mt-8">
                <label className="mb-2 block font-semibold">
                  Translate into
                </label>

                <select
                  value={targetLanguage}
                  onChange={(event) =>
                    setTargetLanguage(event.target.value)
                  }
                  className="w-full rounded-xl border border-[#d7e1da] bg-white px-4 py-4 outline-none focus:border-[#087f5b]"
                >
                  {targetLanguages.map((language) => (
                    <option key={language}>{language}</option>
                  ))}
                </select>
              </div>

              {sourceAndTargetAreSame && (
                <p className="mt-4 rounded-xl bg-[#fff3f0] px-4 py-3 text-sm font-medium text-[#9a3f2f]">
                  Source and target languages must be different.
                </p>
              )}

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => goTo("upload")}
                  className="rounded-lg border border-[#cbd7cf] px-6 py-3 font-semibold"
                >
                  Back
                </button>

                <button
                  disabled={!sourceLanguage || sourceAndTargetAreSame}
                  onClick={() => goTo("document")}
                  className="rounded-lg bg-[#087f5b] px-6 py-3 font-semibold text-white disabled:opacity-40"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === "document" && (
            <>
              <h2 className="text-2xl font-bold">Document type</h2>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {documentTypes.map((item) => (
                  <button
                    key={item}
                    onClick={() => setDocumentType(item)}
                    className={`rounded-xl border px-5 py-4 text-left font-medium ${
                      documentType === item
                        ? "border-[#087f5b] bg-[#eef8f2] text-[#087f5b]"
                        : "border-[#dce6df] hover:border-[#9db9a8]"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => goTo("language")}
                  className="rounded-lg border border-[#cbd7cf] px-6 py-3 font-semibold"
                >
                  Back
                </button>

                <button
                  disabled={!documentType}
                  onClick={() => goTo("purpose")}
                  className="rounded-lg bg-[#087f5b] px-6 py-3 font-semibold text-white disabled:opacity-40"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === "purpose" && (
            <>
              <h2 className="text-2xl font-bold">
                What will the translation be used for?
              </h2>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {purposes.map((item) => (
                  <button
                    key={item}
                    onClick={() => setPurpose(item)}
                    className={`rounded-xl border px-5 py-4 text-left font-medium ${
                      purpose === item
                        ? "border-[#087f5b] bg-[#eef8f2] text-[#087f5b]"
                        : "border-[#dce6df] hover:border-[#9db9a8]"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => goTo("document")}
                  className="rounded-lg border border-[#cbd7cf] px-6 py-3 font-semibold"
                >
                  Back
                </button>

                <button
                  disabled={!purpose}
                  onClick={() => goTo("turnaround")}
                  className="rounded-lg bg-[#087f5b] px-6 py-3 font-semibold text-white disabled:opacity-40"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === "turnaround" && (
            <>
              <h2 className="text-2xl font-bold">Turnaround</h2>

              <div className="mt-7 space-y-3">
                {turnaroundOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => setTurnaround(option)}
                    className={`w-full rounded-xl border p-5 text-left ${
                      turnaround === option
                        ? "border-[#087f5b] bg-[#eef8f2]"
                        : "border-[#dce6df]"
                    }`}
                  >
                    <div className="font-semibold">{option}</div>

                    <div className="mt-1 text-sm text-[#65736b]">
                      {option === "Standard" &&
                        "Standard professional turnaround."}

                      {option === "Priority" &&
                        "Priority service, subject to capacity."}

                      {option === "Urgent" &&
                        "Urgent service, subject to confirmation."}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => goTo("purpose")}
                  className="rounded-lg border border-[#cbd7cf] px-6 py-3 font-semibold"
                >
                  Back
                </button>

                <button
                  onClick={() => goTo("contact")}
                  className="rounded-lg bg-[#087f5b] px-6 py-3 font-semibold text-white"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === "contact" && (
            <>
              <h2 className="text-2xl font-bold">Your details</h2>

              <div className="mt-7 space-y-5">
                <div>
                  <label className="mb-2 block font-semibold">
                    Full name
                  </label>

                  <input
                    value={fullName}
                    onChange={(event) =>
                      setFullName(event.target.value)
                    }
                    className="w-full rounded-xl border border-[#d7e1da] px-4 py-4 outline-none focus:border-[#087f5b]"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-semibold">
                    Email
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-xl border border-[#d7e1da] px-4 py-4 outline-none focus:border-[#087f5b]"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-semibold">
                    Telephone number
                  </label>

                  <input
                    value={telephone}
                    onChange={(event) =>
                      setTelephone(event.target.value)
                    }
                    className="w-full rounded-xl border border-[#d7e1da] px-4 py-4 outline-none focus:border-[#087f5b]"
                  />
                </div>
              </div>

              <div className="mt-8 space-y-4 rounded-2xl bg-[#f7faf8] p-5 text-sm leading-6">
                <label className="flex gap-3">
                  <input
                    type="checkbox"
                    checked={authorised}
                    onChange={(event) =>
                      setAuthorised(event.target.checked)
                    }
                    className="mt-1"
                  />

                  <span>
                    I confirm that I am authorised to submit the uploaded
                    document for translation and processing.
                  </span>
                </label>

                <label className="flex gap-3">
                  <input
                    type="checkbox"
                    checked={authenticityAccepted}
                    onChange={(event) =>
                      setAuthenticityAccepted(event.target.checked)
                    }
                    className="mt-1"
                  />

                  <span>
                    I understand that GLOBAL TRANSLATION HUB does not verify
                    or certify the authenticity, validity or provenance of
                    the source document supplied.
                  </span>
                </label>

                <label className="flex gap-3">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(event) =>
                      setTermsAccepted(event.target.checked)
                    }
                    className="mt-1"
                  />

                  <span>
                    I have read and agree to the Terms & Conditions and
                    Privacy Notice.
                  </span>
                </label>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => goTo("turnaround")}
                  className="rounded-lg border border-[#cbd7cf] px-6 py-3 font-semibold"
                >
                  Back
                </button>

                <button
                  disabled={
                    !fullName.trim() ||
                    !email.trim() ||
                    !authorised ||
                    !authenticityAccepted ||
                    !termsAccepted
                  }
                  onClick={() => goTo("review")}
                  className="rounded-lg bg-[#087f5b] px-6 py-3 font-semibold text-white disabled:opacity-40"
                >
                  Review Details
                </button>
              </div>
            </>
          )}

          {step === "review" && (
            <>
              <h2 className="text-2xl font-bold">
                Review your details
              </h2>

              <p className="mt-3 leading-7 text-[#607067]">
                Please check your information before submitting. Your
                document will only be uploaded after you press Submit
                Enquiry.
              </p>

              <div className="mt-8 divide-y divide-[#e5ebe7] rounded-2xl border border-[#dce6df]">
                <ReviewRow
                  label="Document"
                  value={documentType}
                  onEdit={() => goTo("document")}
                />

                <ReviewRow
                  label="Language"
                  value={`${sourceLanguage} → ${targetLanguage}`}
                  onEdit={() => goTo("language")}
                />

                <ReviewRow
                  label="Purpose"
                  value={purpose}
                  onEdit={() => goTo("purpose")}
                />

                <ReviewRow
                  label="Turnaround"
                  value={turnaround}
                  onEdit={() => goTo("turnaround")}
                />

                <ReviewRow
                  label="Client"
                  value={`${fullName} · ${email}`}
                  onEdit={() => goTo("contact")}
                />

                <ReviewRow
                  label="File"
                  value={file?.name ?? ""}
                  onEdit={() => goTo("upload")}
                />
              </div>

              {submissionError && (
                <div className="mt-6 rounded-xl bg-[#fff0ed] px-5 py-4 text-sm font-medium text-[#9a3f2f]">
                  {submissionError}
                </div>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => goTo("contact")}
                  className="rounded-lg border border-[#cbd7cf] px-6 py-3 font-semibold"
                >
                  Back
                </button>

                <button
                  disabled={!canSubmit || submitting}
                  onClick={submitEnquiry}
                  className="rounded-lg bg-[#087f5b] px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submitting
                    ? "Submitting securely..."
                    : "Submit Enquiry"}
                </button>
              </div>
            </>
          )}

          {step === "result" && result && (
            <>
              {result.requiresManualReview ? (
                <>
                  <div className="inline-flex rounded-full bg-[#fff4d8] px-4 py-2 text-sm font-semibold text-[#8a6418]">
                    Professional Review Required
                  </div>

                  <h2 className="mt-5 text-3xl font-bold">
                    Your document has been submitted for review
                  </h2>

                  <p className="mt-4 max-w-2xl leading-7 text-[#607067]">
                    A member of our team will review the document before a
                    final price and turnaround time are confirmed.
                  </p>

                  <p className="mt-4 font-semibold">
                    No payment will be taken until you have received and
                    approved the quotation.
                  </p>
                </>
              ) : (
                <>
                  <div className="inline-flex rounded-full bg-[#eaf8f0] px-4 py-2 text-sm font-semibold text-[#087f5b]">
                    Quotation Available
                  </div>

                  <h2 className="mt-5 text-3xl font-bold">
                    Your translation quotation
                  </h2>

                  <div className="mt-8 rounded-2xl border border-[#dae6de] bg-[#f9fbfa] p-6">
                    <div className="text-sm text-[#66736c]">
                      Indicative total
                    </div>
                  
                    <div className="mt-1 text-4xl font-bold text-[#087f5b]">
                      {typeof result.amount === "number"
                        ? formatPrice(result.amount)
                        : "Manual review"}
                    </div>
                  
                    <p className="mt-4 text-sm leading-6 text-[#66736c]">
                      Your document is stored temporarily while you decide whether to proceed.
                    </p>
                  </div>
                  
                  {submissionError && (
                    <div className="mt-6 rounded-xl bg-[#fff0ed] px-5 py-4 text-sm font-medium text-[#9a3f2f]">
                      {submissionError}
                    </div>
                  )}
                  
                  <button
                    onClick={proceedToPayment}
                    disabled={submitting || !result.enquiryId}
                    className="mt-6 rounded-lg bg-[#087f5b] px-6 py-4 font-semibold text-white transition hover:bg-[#066a4c] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {submitting
                      ? "Opening secure payment..."
                      : "Proceed to Secure Payment"}
                  </button>
                    

                  <div className="mt-8 rounded-xl border border-[#cfe1d6] bg-[#f4faf6] p-5">
                    <strong>Next stage:</strong> we will connect secure
                    payment. An official GLOBAL TRANSLATION HUB order number
                    will only be created after payment has been confirmed.
                  </div>
                </>
              )}

              <div className="mt-8 rounded-2xl border border-[#e1e7e3] p-6">
                <h3 className="font-bold">Submitted enquiry</h3>

                <p className="mt-3 text-sm leading-6 text-[#607067]">
                  Document: {documentType}
                  <br />
                  Language: {sourceLanguage} → {targetLanguage}
                  <br />
                  Purpose: {purpose}
                  <br />
                  Turnaround: {turnaround}
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    setResult(null);
                    setSubmissionError("");
                    goTo("turnaround");
                  }}
                  className="rounded-lg border border-[#087f5b] px-6 py-3 font-semibold text-[#087f5b]"
                >
                  Edit Quote Details
                </button>
              
                <button
                  onClick={restart}
                  className="rounded-lg border border-[#cbd7cf] px-6 py-3 font-semibold"
                >
                  Start New Enquiry
                </button>
              
                <a
                  href="/"
                  className="rounded-lg bg-[#087f5b] px-6 py-3 font-semibold text-white"
                >
                  Return to Home
                </a>
              </div>
            </>
          )}
        </section>

        <div className="mt-8 rounded-2xl border border-[#e0e7e2] bg-white p-5 text-sm leading-6 text-[#65736b]">
          <strong className="text-[#203027]">
            Source document authenticity:
          </strong>{" "}
          GLOBAL TRANSLATION HUB provides translation services on the basis of
          documents supplied by the client. Translation certification does
          not authenticate or verify the source document itself.
        </div>
      </div>
    </main>
  );
}

function ReviewRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-5 p-5">
      <div>
        <div className="text-sm text-[#6a776f]">{label}</div>
        <div className="mt-1 font-semibold">{value}</div>
      </div>

      <button
        onClick={onEdit}
        className="shrink-0 text-sm font-semibold text-[#087f5b] hover:underline"
      >
        Edit
      </button>
    </div>
  );
}