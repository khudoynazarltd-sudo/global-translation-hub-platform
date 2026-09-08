"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createClient,
} from "@/lib/supabase/client";

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
  "Audio / Video Translation",
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

type PricingOptions = {
  languages: Array<{
    code: string;
    name: string;
    sort_order: number;
  }>;

  services: Array<{
    code: string;
    name: string;
    sort_order: number;
  }>;
};


type QuotePreview = {
  loading: boolean;
  requiresManualReview: boolean;
  amount: number | null;
  currency: string;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(value);
}

export default function QuotePage() {
  const [step, setStep] =
    useState<Step>("upload");

  const [file, setFile] = useState<File | null>(null);

  const [sourceLanguage, setSourceLanguage] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("English");
  const [documentType, setDocumentType] = useState("");
  const [purpose, setPurpose] = useState("");
  const [turnaround, setTurnaround] = useState("Standard");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");

  const [mediaFile, setMediaFile] =
    useState<File | null>(null);

  const [mediaExternalUrl, setMediaExternalUrl] =
    useState("");

  const [mediaOutputOptions, setMediaOutputOptions] =
    useState<string[]>([]);

  const [mediaNotes, setMediaNotes] =
    useState("");

  const isMediaService =
    documentType ===
    "Audio / Video Translation";

  const hasMediaSource =
    Boolean(
      mediaFile ||
      mediaExternalUrl.trim()
    );

  const hasMediaOutput =
    mediaOutputOptions.length > 0;

  const [authorised, setAuthorised] = useState(false);
  const [authenticityAccepted, setAuthenticityAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [result, setResult] = useState<SubmissionResult | null>(null);

  const [
    pricingOptions,
    setPricingOptions,
  ] =
    useState<PricingOptions | null>(
      null
    );


  const [
    pricingOptionsError,
    setPricingOptionsError,
  ] =
    useState("");


  const [
    quotePreview,
    setQuotePreview,
  ] =
    useState<QuotePreview>({
      loading: false,
      requiresManualReview: false,
      amount: null,
      currency: "GBP",
    });

  useEffect(() => {
    const searchParams =
      new URLSearchParams(
        window.location.search
      );

    const service =
      searchParams.get(
        "service"
      );


    if (
      service ===
      "audio-video"
    ) {
      setFile(null);

      setDocumentType(
        "Audio / Video Translation"
      );

      setStep(
        "language"
      );

      return;
    }


    if (
      service ===
      "document"
    ) {
      setDocumentType("");

      setMediaFile(null);
      setMediaExternalUrl("");
      setMediaOutputOptions([]);
      setMediaNotes("");

      setStep(
        "upload"
      );
    }
  }, []);

  const sourceAndTargetAreSame =
    sourceLanguage !== "" &&
    sourceLanguage === targetLanguage;

  useEffect(() => {
    let active = true;

  const isMediaService =
    documentType ===
    "Audio / Video Translation";

  const hasMediaSource =
    mediaFile !== null ||
    mediaExternalUrl.trim() !== "";

  const hasMediaOutput =
    mediaOutputOptions.length > 0;

    async function loadPricingOptions() {
      try {
        const response =
          await fetch(
            "/api/pricing/options",
            {
              method: "GET",
              cache: "no-store",
            }
          );


        const data =
          await response.json();


        if (
          !response.ok ||
          !data.ok
        ) {
          throw new Error(
            data.message ||
              "Unable to load quotation options."
          );
        }


        if (!active) {
          return;
        }


        setPricingOptions({
          languages:
            data.languages ??
            [],

          services:
            data.services ??
            [],
        });

        setPricingOptionsError("");

      } catch (error) {
        if (!active) {
          return;
        }


        setPricingOptionsError(
          error instanceof Error
            ? error.message
            : "Unable to load quotation options."
        );
      }
    }


    loadPricingOptions();


    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (
      !sourceLanguage ||
      !targetLanguage ||
      !documentType ||
      !turnaround ||
      sourceAndTargetAreSame
    ) {
      setQuotePreview({
        loading: false,
        requiresManualReview: false,
        amount: null,
        currency: "GBP",
      });

      return;
    }


    const controller =
      new AbortController();


    async function loadQuote() {
      setQuotePreview(
        (current) => ({
          ...current,
          loading: true,
        })
      );


      try {
        const response =
          await fetch(
            "/api/pricing/quote",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  sourceLanguage,
                  targetLanguage,
                  documentType,
                  turnaround,
                }),

              signal:
                controller.signal,

              cache:
                "no-store",
            }
          );


        const data =
          await response.json();


        if (
          !response.ok ||
          !data.ok
        ) {
          throw new Error(
            data.message ||
              "Unable to calculate quotation."
          );
        }


        setQuotePreview({
          loading: false,

          requiresManualReview:
            Boolean(
              data.requiresManualReview
            ),

          amount:
            data.amount != null
              ? Number(
                  data.amount
                )
              : null,

          currency:
            data.currency ||
            "GBP",
        });

      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name ===
            "AbortError"
        ) {
          return;
        }


        console.error(
          "Quote preview failed:",
          error
        );


        setQuotePreview({
          loading: false,
          requiresManualReview: false,
          amount: null,
          currency: "GBP",
        });
      }
    }


    loadQuote();


    return () => {
      controller.abort();
    };
  }, [
    sourceLanguage,
    targetLanguage,
    documentType,
    turnaround,
    sourceAndTargetAreSame,
  ]);

  const canSubmit = useMemo(() => {
    return (
      (
        isMediaService
          ? hasMediaSource &&
            hasMediaOutput
          : file !== null
      ) &&
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
    isMediaService,
    hasMediaSource,
    hasMediaOutput,
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
    setMediaFile(null);
    setMediaExternalUrl("");
    setMediaOutputOptions([]);
    setMediaNotes("");
    setAuthorised(false);
    setAuthenticityAccepted(false);
    setTermsAccepted(false);
    setSubmitting(false);
    setSubmissionError("");
    setResult(null);
  }

  function toggleMediaOutputOption(
    option: string
  ) {
    setMediaOutputOptions(
      (current) =>
        current.includes(option)
          ? current.filter(
              (item) =>
                item !== option
            )
          : [
              ...current,
              option,
            ]
    );
  }

  async function uploadMediaFile(
    selectedFile: File
  ) {
    if (
      selectedFile.size >
      50 * 1024 * 1024
    ) {
      throw new Error(
        "Files larger than 50 MB must be provided using a secure external file-sharing link."
      );
    }

    const prepareResponse =
      await fetch(
        "/api/enquiries/media-upload",
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              filename:
                selectedFile.name,

              mimeType:
                selectedFile.type,

              fileSize:
                selectedFile.size,
            }),
        }
      );

    const prepareData =
      await prepareResponse.json();

    if (
      !prepareResponse.ok ||
      !prepareData.ok ||
      !prepareData.path ||
      !prepareData.token
    ) {
      throw new Error(
        prepareData.message ||
          "Unable to prepare secure media upload."
      );
    }

    const supabase =
      createClient();

    const {
      error: uploadError,
    } =
      await supabase.storage
        .from(
          "temporary-enquiries"
        )
        .uploadToSignedUrl(
          prepareData.path,
          prepareData.token,
          selectedFile,
          {
            contentType:
              selectedFile.type,
          }
        );

    if (uploadError) {
      throw new Error(
        "Unable to upload the audio or video file."
      );
    }

    return {
      path:
        prepareData.path,

      originalFilename:
        selectedFile.name,

      mimeType:
        selectedFile.type,

      fileSize:
        selectedFile.size,
    };
  }

  async function submitEnquiry() {
    if (!canSubmit) {
      return;
    }

    if (
      !isMediaService &&
      !file
    ) {
      return;
    }

    setSubmitting(true);
    setSubmissionError("");

    try {
      let uploadedMedia:
        {
          path: string;
          originalFilename: string;
          mimeType: string;
          fileSize: number;
        } | null =
        null;

      if (
        isMediaService &&
        mediaFile
      ) {
        uploadedMedia =
          await uploadMediaFile(
            mediaFile
          );
      }

      const formData =
        new FormData();

    if (
      !isMediaService &&
      file
    ) {
      formData.append(
        "file",
        file
      );
    }

    formData.append(
      "fullName",
      fullName.trim()
    );
      formData.append("email", email.trim());
      formData.append("telephone", telephone.trim());
      formData.append("sourceLanguage", sourceLanguage);
      formData.append("targetLanguage", targetLanguage);
      formData.append("documentType", documentType);
      formData.append("purpose", purpose);
      formData.append("turnaround", turnaround);

    if (isMediaService) {
      formData.append(
        "mediaExternalUrl",
        mediaExternalUrl.trim()
      );

      formData.append(
        "mediaOutputOptions",
        JSON.stringify(
          mediaOutputOptions
        )
      );

      formData.append(
        "mediaNotes",
        mediaNotes.trim()
      );

      if (uploadedMedia) {
        formData.append(
          "mediaStoragePath",
          uploadedMedia.path
        );

        formData.append(
          "mediaOriginalFilename",
          uploadedMedia.originalFilename
        );

        formData.append(
          "mediaMimeType",
          uploadedMedia.mimeType
        );

        formData.append(
          "mediaFileSize",
          String(
            uploadedMedia.fileSize
          )
        );
      }
    }

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
              <h2 className="text-2xl font-bold">
                What would you like us to translate?
              </h2>

              <p className="mt-3 leading-7 text-[#607067]">
                Choose a document translation or continue with an audio or
                video translation enquiry.
              </p>


              <div className="mt-8 rounded-2xl border border-[#dce6df] bg-white p-6">
                <div className="text-sm font-semibold uppercase tracking-[0.14em] text-[#087f5b]">
                  Document Translation
                </div>

                <h3 className="mt-2 text-xl font-bold">
                  Upload your document
                </h3>

                <p className="mt-2 leading-7 text-[#607067]">
                  Upload a PDF, scan or clear photograph of the document you
                  require us to translate.
                </p>


                <label className="mt-6 block cursor-pointer rounded-2xl border-2 border-dashed border-[#bed2c5] bg-[#f8fbf9] p-10 text-center transition hover:border-[#087f5b]">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(event) => {
                      const selected =
                        event.target.files?.[0] ??
                        null;

                      setFile(selected);

                      if (selected) {
                        setDocumentType("");
                        setMediaFile(null);
                        setMediaExternalUrl("");
                        setMediaOutputOptions([]);
                        setMediaNotes("");
                      }
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
                    Selected file:{" "}
                    <strong>
                      {file.name}
                    </strong>
                  </div>
                )}


                <button
                  disabled={!file}
                  onClick={() =>
                    goTo("language")
                  }
                  className="mt-6 rounded-lg bg-[#087f5b] px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continue with Document
                </button>
              </div>


              <div className="my-7 flex items-center gap-4">
                <div className="h-px flex-1 bg-[#dce6df]" />

                <span className="text-sm font-semibold uppercase tracking-[0.14em] text-[#7a8780]">
                  Or
                </span>

                <div className="h-px flex-1 bg-[#dce6df]" />
              </div>


              <div className="rounded-2xl border border-[#b9d8c7] bg-[#f1f8f4] p-6">
                <div className="text-sm font-semibold uppercase tracking-[0.14em] text-[#087f5b]">
                  Audio & Video Translation
                </div>

                <h3 className="mt-2 text-xl font-bold">
                  Translate audio or video content
                </h3>

                <p className="mt-3 leading-7 text-[#607067]">
                  We can translate audio and video content and provide a
                  written transcript and translation, certified written
                  translation, subtitles, or translation for voiceover and
                  audio overlay.
                </p>

                <p className="mt-3 leading-7 text-[#607067]">
                  Files up to 50 MB may be uploaded securely through the
                  website. For larger files, you can provide a secure Google
                  Drive, Dropbox, OneDrive or WeTransfer link.
                </p>

                <div className="mt-5 flex flex-wrap gap-2 text-sm">
                  {[
                    "Transcript & Translation",
                    "Certified Written Translation",
                    "Subtitles",
                    "Voiceover / Overlay",
                  ].map(
                    (item) => (
                      <span
                        key={item}
                        className="rounded-full border border-[#cfe4d8] bg-white px-3 py-2 text-[#315244]"
                      >
                        {item}
                      </span>
                    )
                  )}
                </div>

                <p className="mt-5 text-sm font-medium text-[#536259]">
                  Audio and video services are reviewed and quoted
                  individually.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setFile(null);

                    setDocumentType(
                      "Audio / Video Translation"
                    );

                    goTo(
                      "language"
                    );
                  }}
                  className="mt-6 rounded-lg bg-[#087f5b] px-6 py-3 font-semibold text-white transition hover:bg-[#066a4c]"
                >
                  Continue with Audio / Video
                </button>
              </div>
            </>
          )}

          {step === "language" && (
            <>
              <h2 className="text-2xl font-bold">Language details</h2>

              <p className="mt-3 text-[#607067]">
                {isMediaService
                  ? "What language is spoken in the source audio or video?"
                  : "What language is the source document written in?"}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  ...(
                    pricingOptions?.languages.map(
                      (language) =>
                        language.name
                    ) ??
                    languages.filter(
                      (language) =>
                        language !== "Other" &&
                        language !== "Not sure"
                    )
                  ),

                  "Other",
                  "Not sure",
                ].map((language) => (
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
                  {(
                    pricingOptions?.languages.map(
                      (language) =>
                        language.name
                    ) ??
                    targetLanguages
                  ).map((language) => (
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
                  disabled={
                    !sourceLanguage ||
                    sourceAndTargetAreSame
                  }
                  onClick={() => {
                    if (
                      documentType ===
                      "Audio / Video Translation"
                    ) {
                      goTo(
                        "document"
                      );

                      return;
                    }

                    goTo(
                      "document"
                    );
                  }}
                  className="rounded-lg bg-[#087f5b] px-6 py-3 font-semibold text-white disabled:opacity-40"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === "document" && (
            <>
              <h2 className="text-2xl font-bold">
                {isMediaService
                  ? "Upload Audio / Video"
                  : "Document type"}
              </h2>
              {!isMediaService && (
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {(
                    pricingOptions?.services.map(
                      (service) =>
                        service.name
                    ) ??
                    documentTypes
                  ).map((item) => (
                    <button
                      key={item}
                      onClick={() =>
                        setDocumentType(item)
                      }
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
              )}
              {isMediaService && (
                <div className="mt-6 rounded-2xl border border-[#cfe4d8] bg-[#f8fbf9] p-6">

                  <h3 className="text-xl font-bold">
                    Provide your audio or video file
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#607067]">
                    Upload your audio or video file securely if it is up to 50 MB.
                    For larger files, provide a secure Google Drive, Dropbox,
                    OneDrive or WeTransfer link instead.
                  </p>

                  <div className="mt-6">
                    <label className="mb-2 block text-sm font-semibold">
                      Audio / Video
                    </label>

                    <input
                      type="file"
                      accept=".mp3,.wav,.m4a,.aac,.mp4,.mov,.webm"
                      onChange={(event) =>
                        setMediaFile(
                          event.target.files?.[0] ??
                            null
                        )
                      }
                      className="block w-full rounded-xl border border-[#d7e1da] bg-white p-3"
                    />

                    {mediaFile && (
                      <div className="mt-2 text-sm text-[#607067]">
                        Selected:{" "}
                        <strong>
                          {mediaFile.name}
                        </strong>
                        {" · "}
                        {(
                          mediaFile.size /
                          1024 /
                          1024
                        ).toFixed(2)}
                        {" MB"}
                      </div>
                    )}
                  </div>


                  <div className="mt-6">
                    <label className="mb-2 block text-sm font-semibold">
                      Or provide a large-file link
                    </label>

                    <input
                      type="url"
                      value={
                        mediaExternalUrl
                      }
                      onChange={(event) =>
                        setMediaExternalUrl(
                          event.target.value
                        )
                      }
                      placeholder="Google Drive, Dropbox, OneDrive, WeTransfer..."
                      className="w-full rounded-xl border border-[#d7e1da] bg-white px-4 py-3 outline-none focus:border-[#087f5b]"
                    />

                    <p className="mt-2 text-xs leading-5 text-[#69766f]">
                      Please ensure that our review team can access
                      the file without requesting additional permission.
                    </p>
                  </div>


                  <div className="mt-7">
                    <div className="text-sm font-semibold">
                      Required Output
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">

                      {[
                        "Written transcript + translation",
                        "Certified written translation",
                        "Subtitles",
                        "Voiceover / translation overlay",
                        "Other / custom requirement",
                      ].map(
                        (option) => (
                          <label
                            key={option}
                            className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#dce6df] bg-white p-4"
                          >
                            <input
                              type="checkbox"
                              checked={
                                mediaOutputOptions.includes(
                                  option
                                )
                              }
                              onChange={() =>
                                toggleMediaOutputOption(
                                  option
                                )
                              }
                              className="mt-1"
                            />

                            <span className="text-sm font-medium">
                              {option}
                            </span>
                          </label>
                        )
                      )}

                    </div>
                  </div>


                  <div className="mt-6">
                    <label className="mb-2 block text-sm font-semibold">
                      Additional Requirements
                    </label>

                    <textarea
                      value={
                        mediaNotes
                      }
                      onChange={(event) =>
                        setMediaNotes(
                          event.target.value
                        )
                      }
                      rows={5}
                      placeholder="Describe the content, preferred format, timing requirements or any other relevant details."
                      className="w-full rounded-xl border border-[#d7e1da] bg-white px-4 py-3 outline-none focus:border-[#087f5b]"
                    />
                  </div>

                </div>
              )}

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
              <h2 className="text-2xl font-bold">
                Turnaround
              </h2>


              <div className="mt-5 rounded-2xl border border-[#dce6df] bg-[#fafcfb] p-5">

                <div className="text-sm text-[#65736b]">
                  Current quotation
                </div>


                {quotePreview.loading ? (
                  <div className="mt-2 font-semibold text-[#607067]">
                    Calculating...
                  </div>
                ) : quotePreview.requiresManualReview ? (
                  <div className="mt-2">

                    <div className="text-xl font-bold text-[#8a6418]">
                      Manual Review Required
                    </div>

                    <p className="mt-2 text-sm leading-6 text-[#69766f]">
                      We will review the document and prepare
                      a quotation before payment.
                    </p>

                  </div>
                ) : quotePreview.amount != null ? (
                  <div className="mt-2 text-3xl font-bold text-[#087f5b]">
                    {formatPrice(
                      quotePreview.amount
                    )}
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-[#69766f]">
                    Select the required turnaround option.
                  </div>
                )}

              </div>


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
                        "Standard turnaround: up to 3 working days."}

                      {option === "Priority" &&
                        "Priority turnaround: approximately 1.5–2 working days, subject to capacity."}

                      {option === "Urgent" &&
                        "Urgent turnaround: within 1 working day, subject to availability and confirmation."}
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
                {isMediaService
                  ? mediaFile
                    ? "Please check your information before submitting. Your audio or video file will only be uploaded after you press Submit Enquiry."
                    : "Please check your information before submitting your enquiry."
                  : "Please check your information before submitting. Your document will only be uploaded after you press Submit Enquiry."}
              </p>
              <div className="mt-8 divide-y divide-[#e5ebe7] rounded-2xl border border-[#dce6df]">
                <ReviewRow
                  label={
                    isMediaService
                      ? "Service"
                      : "Document"
                  }
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

                {isMediaService ? (
                  <>
                    <ReviewRow
                      label={
                        mediaFile
                          ? "Media File"
                          : "External File Link"
                      }
                      value={
                        mediaFile
                          ? mediaFile.name
                          : mediaExternalUrl
                      }
                      onEdit={() => goTo("document")}
                    />

                    <ReviewRow
                      label="Requested Output"
                      value={
                        mediaOutputOptions.length > 0
                          ? mediaOutputOptions.join(", ")
                          : "Not selected"
                      }
                      onEdit={() => goTo("document")}
                    />

                    {mediaNotes.trim() !== "" && (
                      <ReviewRow
                        label="Additional Requirements"
                        value={mediaNotes}
                        onEdit={() => goTo("document")}
                      />
                    )}
                  </>
                ) : (
                  <ReviewRow
                    label="File"
                    value={file?.name ?? ""}
                    onEdit={() => goTo("upload")}
                  />
                )}
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

          {pricingOptionsError && (
            <div className="mb-6 rounded-xl bg-[#fff0ed] px-4 py-3 text-sm text-[#9a3f2f]">
              {pricingOptionsError}
            </div>
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