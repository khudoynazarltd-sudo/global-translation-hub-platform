"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";


type Service = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  base_price: number | null;
  manual_review: boolean;
  active: boolean;
  sort_order: number;
};


type Language = {
  id: string;
  code: string;
  name: string;
  active: boolean;
  sort_order: number;
};


type PairPrice = {
  id: string;
  source_language_id: string;
  target_language_id: string;
  base_price: number;
  active: boolean;
};


type LanguagePrice = {
  id: string;
  service_id: string;
  source_language_id: string;
  target_language_id: string;
  price: number;
  manual_review: boolean;
  active: boolean;
};


type Settings = {
  standard_multiplier: number;
  priority_multiplier: number;
  urgent_multiplier: number;
};


type ApiOptions = {
  refresh?: boolean;
  manageSaving?: boolean;
};


export default function PricingManager({
  services,
  languages,
  pairPrices,
  languagePrices,
  settings,
}: {
  services: Service[];
  languages: Language[];
  pairPrices: PairPrice[];
  languagePrices: LanguagePrice[];
  settings: Settings;
}) {
  const router =
    useRouter();


  const [message, setMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [saving, setSaving] =
    useState(false);


  const activePairs =
    pairPrices.filter(
      (pair) =>
        pair.active
    );


  const [selectedPairId, setSelectedPairId] =
    useState(
      activePairs[0]?.id ?? ""
    );


  const selectedPair =
    activePairs.find(
      (pair) =>
        pair.id ===
        selectedPairId
    ) ??
    activePairs[0] ??
    null;


  const [newServiceName, setNewServiceName] =
    useState("");

  const [newServiceCode, setNewServiceCode] =
    useState("");

  const [newServicePrice, setNewServicePrice] =
    useState("");


  const [newLanguageName, setNewLanguageName] =
    useState("");

  const [newLanguageCode, setNewLanguageCode] =
    useState("");


  async function api(
    body: Record<string, unknown>,
    options: ApiOptions = {}
  ) {
    const {
      refresh = true,
      manageSaving = true,
    } =
      options;


    if (manageSaving) {
      setSaving(true);
    }

    setMessage("");
    setErrorMessage("");


    try {
      const response =
        await fetch(
          "/api/admin/pricing",
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
            "Unable to update pricing."
        );
      }


      if (refresh) {
        setMessage(
          data.message ||
            "Pricing updated."
        );

        router.refresh();
      }


      return true;

    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update pricing."
      );

      return false;

    } finally {
      if (manageSaving) {
        setSaving(false);
      }
    }
  }


  async function saveAllServices(
    formData: FormData
  ) {
    if (!selectedPair) {
      setErrorMessage(
        "Select a language pair."
      );

      return;
    }


    setSaving(true);
    setMessage("");
    setErrorMessage("");


    try {
      for (
        const service of services
      ) {
        const manualReview =
          formData.get(
            `manualReview-${service.id}`
          ) === "on";

        const active =
          formData.get(
            `active-${service.id}`
          ) === "on";

        const name =
          String(
            formData.get(
              `name-${service.id}`
            ) ?? ""
          ).trim();

        const pairPrice =
          String(
            formData.get(
              `pairPrice-${service.id}`
            ) ?? ""
          ).trim();


        const serviceUpdated =
          await api(
            {
              action:
                "update_service",

              id:
                service.id,

              name,

              basePrice:
                service.base_price ??
                "",

              manualReview,

              active,
            },
            {
              refresh:
                false,

              manageSaving:
                false,
            }
          );


        if (!serviceUpdated) {
          return;
        }


        if (
          !manualReview &&
          active
        ) {
          const priceUpdated =
            await api(
              {
                action:
                  "add_language_price",

                serviceId:
                  service.id,

                sourceLanguageId:
                  selectedPair.source_language_id,

                targetLanguageId:
                  selectedPair.target_language_id,

                price:
                  pairPrice,
              },
              {
                refresh:
                  false,

                manageSaving:
                  false,
              }
            );


          if (!priceUpdated) {
            return;
          }
        }
      }


      setMessage(
        "All service prices saved."
      );

      router.refresh();

    } finally {
      setSaving(false);
    }
  }


  return (
    <div className="mt-8 space-y-8">


      <section className="rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm">

        <h2 className="text-xl font-bold">
          Base Language Pair Prices
        </h2>

        <p className="mt-2 text-sm leading-6 text-[#69766f]">
          Set the default reference price for each
          active language direction.
        </p>


        <div className="mt-6 space-y-4">

          {pairPrices.map(
            (pair) => {

              const source =
                languages.find(
                  (language) =>
                    language.id ===
                    pair.source_language_id
                );

              const target =
                languages.find(
                  (language) =>
                    language.id ===
                    pair.target_language_id
                );


              return (
                <form
                  key={pair.id}
                  action={async (
                    formData
                  ) => {
                    await api({
                      action:
                        "update_pair_price",

                      id:
                        pair.id,

                      price:
                        formData.get(
                          "price"
                        ),
                    });
                  }}
                  className="grid gap-4 rounded-xl border border-[#e3ebe6] bg-[#fafcfb] p-4 sm:grid-cols-[1fr_1fr_180px_auto]"
                >

                  <div className="flex items-center font-semibold">
                    {source?.name}
                  </div>


                  <div className="flex items-center font-semibold">
                    → {target?.name}
                  </div>


                  <div className="relative">

                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold">
                      £
                    </span>

                    <input
                      name="price"
                      type="number"
                      min="0.01"
                      step="0.01"
                      defaultValue={
                        pair.base_price
                      }
                      className="w-full rounded-xl border border-[#d7e1da] py-3 pl-8 pr-4"
                    />

                  </div>


                  <button
                    disabled={saving}
                    className="rounded-xl bg-[#087f5b] px-5 py-3 font-semibold text-white disabled:opacity-50"
                  >
                    Save
                  </button>

                </form>
              );
            }
          )}

        </div>

      </section>


      <section className="rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm">

        <h2 className="text-xl font-bold">
          Turnaround Pricing
        </h2>


        <form
          action={async (
            formData
          ) => {
            await api({
              action:
                "update_settings",

              standard:
                formData.get(
                  "standard"
                ),

              priority:
                formData.get(
                  "priority"
                ),

              urgent:
                formData.get(
                  "urgent"
                ),
            });
          }}
          className="mt-6 grid gap-5 sm:grid-cols-3"
        >

          <NumberField
            name="standard"
            label="Standard Multiplier"
            defaultValue={
              settings.standard_multiplier
            }
          />

          <NumberField
            name="priority"
            label="Priority Multiplier"
            defaultValue={
              settings.priority_multiplier
            }
          />

          <NumberField
            name="urgent"
            label="Urgent Multiplier"
            defaultValue={
              settings.urgent_multiplier
            }
          />


          <div className="sm:col-span-3">

            <button
              disabled={saving}
              className="rounded-xl bg-[#087f5b] px-6 py-3 font-semibold text-white disabled:opacity-50"
            >
              Save Multipliers
            </button>

          </div>

        </form>

      </section>


      <section className="rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm">

        <div className="flex flex-wrap items-center justify-between gap-4">

          <div>

            <h2 className="text-xl font-bold">
              Services
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#69766f]">
              Choose a language pair, update the
              service prices, then save all services
              with one button.
            </p>

          </div>


          <select
            value={
              selectedPair?.id ??
              ""
            }
            onChange={(
              event
            ) =>
              setSelectedPairId(
                event.target.value
              )
            }
            className="rounded-xl border border-[#d7e1da] bg-white px-4 py-3 font-semibold"
          >

            {activePairs.map(
              (pair) => {

                const source =
                  languages.find(
                    (language) =>
                      language.id ===
                      pair.source_language_id
                  );

                const target =
                  languages.find(
                    (language) =>
                      language.id ===
                      pair.target_language_id
                  );


                return (
                  <option
                    key={pair.id}
                    value={pair.id}
                  >
                    {source?.name} →{" "}
                    {target?.name}
                  </option>
                );
              }
            )}

          </select>

        </div>


        <form
          key={
            selectedPair?.id ??
            "no-pair"
          }
          onSubmit={async (
            event
          ) => {
            event.preventDefault();

            await saveAllServices(
              new FormData(
                event.currentTarget
              )
            );
          }}
          className="mt-6 space-y-4"
        >

          {services.map(
            (
              service,
              serviceIndex
            ) => {

              const currentPrice =
                selectedPair
                  ? languagePrices.find(
                      (item) =>
                        item.service_id ===
                          service.id &&
                        item.source_language_id ===
                          selectedPair.source_language_id &&
                        item.target_language_id ===
                          selectedPair.target_language_id &&
                        item.active
                    )
                  : undefined;


              return (
                <div
                  key={service.id}
                  className="grid gap-4 rounded-xl border border-[#e3ebe6] bg-[#fafcfb] p-4 lg:grid-cols-[auto_2fr_1fr_auto_auto]"
                >

                  <input
                    name={`name-${service.id}`}
                    defaultValue={
                      service.name
                    }
                    className="rounded-xl border border-[#d7e1da] px-4 py-3"
                  />

                  <div className="flex items-center gap-1">

                    <button
                      type="button"
                      disabled={
                        saving ||
                        serviceIndex ===
                          0
                      }
                      onClick={async () => {
                        await api({
                          action:
                            "move_service",

                          id:
                            service.id,

                          direction:
                            "up",
                        });
                      }}
                      aria-label={`Move ${service.name} up`}
                      title="Move up"
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#d7e1da] bg-white text-lg font-bold text-[#315244] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      ↑
                    </button>


                    <button
                      type="button"
                      disabled={
                        saving ||
                        serviceIndex ===
                          services.length -
                            1
                      }
                      onClick={async () => {
                        await api({
                          action:
                            "move_service",

                          id:
                            service.id,

                          direction:
                            "down",
                        });
                      }}
                      aria-label={`Move ${service.name} down`}
                      title="Move down"
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#d7e1da] bg-white text-lg font-bold text-[#315244] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      ↓
                    </button>

                  </div>



                  <div className="relative">

                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold">
                      £
                    </span>

                  <input
                      name={`pairPrice-${service.id}`}
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={
                        currentPrice?.price ??
                        service.base_price ??
                        ""
                      }
                      placeholder="Price"
                      className="w-full rounded-xl border border-[#d7e1da] py-3 pl-8 pr-4"
                    />

                  </div>


                  <label className="flex items-center gap-2 text-sm">
                    <input
                      name={`manualReview-${service.id}`}
                      type="checkbox"
                      defaultChecked={
                        service.manual_review
                      }
                    />

                    Manual Review
                  </label>


                  <label className="flex items-center gap-2 text-sm">
                    <input
                      name={`active-${service.id}`}
                      type="checkbox"
                      defaultChecked={
                        service.active
                      }
                    />

                    Active
                  </label>

                </div>
              );
            }
          )}


          <div className="flex justify-end pt-2">

            <button
              disabled={
                saving ||
                !selectedPair
              }
              className="rounded-xl bg-[#087f5b] px-7 py-3 font-semibold text-white disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Save All Services"}
            </button>

          </div>

        </form>


        <div className="mt-8 border-t border-[#e3ebe6] pt-6">

          <h3 className="font-bold">
            Add Service
          </h3>


          <div className="mt-4 grid gap-4 sm:grid-cols-3">

            <input
              value={
                newServiceName
              }
              onChange={(
                event
              ) =>
                setNewServiceName(
                  event.target.value
                )
              }
              placeholder="Service name"
              className="rounded-xl border border-[#d7e1da] px-4 py-3"
            />


            <input
              value={
                newServiceCode
              }
              onChange={(
                event
              ) =>
                setNewServiceCode(
                  event.target.value
                )
              }
              placeholder="service_code"
              className="rounded-xl border border-[#d7e1da] px-4 py-3"
            />


            <input
              value={
                newServicePrice
              }
              onChange={(
                event
              ) =>
                setNewServicePrice(
                  event.target.value
                )
              }
              type="number"
              min="0"
              step="0.01"
              placeholder="Base price"
              className="rounded-xl border border-[#d7e1da] px-4 py-3"
            />

          </div>


          <button
            type="button"
            disabled={saving}
            onClick={async () => {
              const ok =
                await api({
                  action:
                    "add_service",

                  name:
                    newServiceName,

                  code:
                    newServiceCode,

                  basePrice:
                    newServicePrice,
                });


              if (ok) {
                setNewServiceName(
                  ""
                );

                setNewServiceCode(
                  ""
                );

                setNewServicePrice(
                  ""
                );
              }
            }}
            className="mt-4 rounded-xl bg-[#102b20] px-6 py-3 font-semibold text-white disabled:opacity-50"
          >
            Add Service
          </button>

        </div>

      </section>


      <section className="rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm">

        <h2 className="text-xl font-bold">
          Languages
        </h2>


        <div className="mt-5 flex flex-wrap gap-2">

          {languages.map(
            (language) => (
              <span
                key={language.id}
                className="rounded-full bg-[#eef7f2] px-4 py-2 text-sm font-semibold text-[#087f5b]"
              >
                {language.name}
              </span>
            )
          )}

        </div>


        <div className="mt-7 grid gap-4 sm:grid-cols-2">

          <input
            value={
              newLanguageName
            }
            onChange={(
              event
            ) =>
              setNewLanguageName(
                event.target.value
              )
            }
            placeholder="Language name"
            className="rounded-xl border border-[#d7e1da] px-4 py-3"
          />


          <input
            value={
              newLanguageCode
            }
            onChange={(
              event
            ) =>
              setNewLanguageCode(
                event.target.value
              )
            }
            placeholder="Code, e.g. uz"
            className="rounded-xl border border-[#d7e1da] px-4 py-3"
          />

        </div>


        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            const ok =
              await api({
                action:
                  "add_language",

                name:
                  newLanguageName,

                code:
                  newLanguageCode,
              });


            if (ok) {
              setNewLanguageName(
                ""
              );

              setNewLanguageCode(
                ""
              );
            }
          }}
          className="mt-4 rounded-xl bg-[#102b20] px-6 py-3 font-semibold text-white disabled:opacity-50"
        >
          Add Language
        </button>

      </section>


      {message && (
        <div className="rounded-xl bg-[#eaf8f0] px-4 py-3 text-sm font-medium text-[#087f5b]">
          {message}
        </div>
      )}


      {errorMessage && (
        <div className="rounded-xl bg-[#fff0ed] px-4 py-3 text-sm text-[#9a3f2f]">
          {errorMessage}
        </div>
      )}

    </div>
  );
}


function NumberField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: number;
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-semibold">
        {label}
      </label>

      <input
        name={name}
        type="number"
        min="0"
        step="0.001"
                    defaultValue={
          defaultValue
        }
        className="w-full rounded-xl border border-[#d7e1da] px-4 py-3"
      />

    </div>
  );
}