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


  const [priceService, setPriceService] =
    useState(
      services[0]?.id ?? ""
    );

  const [priceSource, setPriceSource] =
    useState(
      languages[0]?.id ?? ""
    );

  const [priceTarget, setPriceTarget] =
    useState(
      languages.find(
        (language) =>
          language.code === "en"
      )?.id ??
        languages[0]?.id ??
        ""
    );

  const [specialPrice, setSpecialPrice] =
    useState("");


  async function api(
    body: Record<string, unknown>
  ) {
    setSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response =
        await fetch(
          "/api/admin/pricing",
          {
            method: "POST",

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


      setMessage(
        data.message ||
          "Pricing updated."
      );

      router.refresh();

      return true;

    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update pricing."
      );

      return false;

    } finally {
      setSaving(false);
    }
  }


  async function updateService(
    service: Service,
    formData: FormData
  ) {
    await api({
      action:
        "update_service",

      id:
        service.id,

      name:
        String(
          formData.get("name") ??
            ""
        ),

      basePrice:
        String(
          formData.get(
            "basePrice"
          ) ?? ""
        ),

      manualReview:
        formData.get(
          "manualReview"
        ) === "on",

      active:
        formData.get(
          "active"
        ) === "on",
    });
  }


  return (
    <div className="mt-8 space-y-8">

      <section className="rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm">

        <h2 className="text-xl font-bold">
          Base Language Pair Prices
        </h2>

        <p className="mt-2 text-sm leading-6 text-[#69766f]">
          This is the default price used for all
          automatically priced services unless a
          service-specific override exists.
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
          action={async (formData) => {
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

            <p className="mt-2 text-sm text-[#69766f]">
              Change base prices or send a service
              to Manual Review.
            </p>
          </div>

        </div>


        <div className="mt-6 space-y-4">

          {services.map(
            (service) => (
              <form
                key={service.id}
                action={async (
                  formData
                ) => {
                  await updateService(
                    service,
                    formData
                  );
                }}
                className="grid gap-4 rounded-xl border border-[#e3ebe6] bg-[#fafcfb] p-4 lg:grid-cols-[2fr_1fr_auto_auto_auto]"
              >

                <input
                  name="name"
                  defaultValue={
                    service.name
                  }
                  className="rounded-xl border border-[#d7e1da] px-4 py-3"
                />


                <input
                  name="basePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={
                    service.base_price ??
                    ""
                  }
                  placeholder="Price"
                  className="rounded-xl border border-[#d7e1da] px-4 py-3"
                />


                <label className="flex items-center gap-2 text-sm">
                  <input
                    name="manualReview"
                    type="checkbox"
                    defaultChecked={
                      service.manual_review
                    }
                  />
                  Manual Review
                </label>


                <label className="flex items-center gap-2 text-sm">
                  <input
                    name="active"
                    type="checkbox"
                    defaultChecked={
                      service.active
                    }
                  />
                  Active
                </label>


                <button
                  disabled={saving}
                  className="rounded-xl bg-[#087f5b] px-5 py-3 font-semibold text-white disabled:opacity-50"
                >
                  Save
                </button>

              </form>
            )
          )}

        </div>


        <div className="mt-8 border-t border-[#e3ebe6] pt-6">

          <h3 className="font-bold">
            Add Service
          </h3>


          <div className="mt-4 grid gap-4 sm:grid-cols-3">

            <input
              value={newServiceName}
              onChange={(event) =>
                setNewServiceName(
                  event.target.value
                )
              }
              placeholder="Service name"
              className="rounded-xl border border-[#d7e1da] px-4 py-3"
            />

            <input
              value={newServiceCode}
              onChange={(event) =>
                setNewServiceCode(
                  event.target.value
                )
              }
              placeholder="service_code"
              className="rounded-xl border border-[#d7e1da] px-4 py-3"
            />

            <input
              value={newServicePrice}
              onChange={(event) =>
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
                setNewServiceName("");
                setNewServiceCode("");
                setNewServicePrice("");
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
            value={newLanguageName}
            onChange={(event) =>
              setNewLanguageName(
                event.target.value
              )
            }
            placeholder="Language name"
            className="rounded-xl border border-[#d7e1da] px-4 py-3"
          />

          <input
            value={newLanguageCode}
            onChange={(event) =>
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
              setNewLanguageName("");
              setNewLanguageCode("");
            }
          }}
          className="mt-4 rounded-xl bg-[#102b20] px-6 py-3 font-semibold text-white disabled:opacity-50"
        >
          Add Language
        </button>

      </section>


      <section className="rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm">

        <h2 className="text-xl font-bold">
          Language-Specific Prices
        </h2>

        <p className="mt-2 text-sm text-[#69766f]">
          These prices override the base service price
          for a specific language direction.
        </p>


        <div className="mt-6 grid gap-4 md:grid-cols-4">

          <select
            value={priceService}
            onChange={(event) =>
              setPriceService(
                event.target.value
              )
            }
            className="rounded-xl border border-[#d7e1da] bg-white px-4 py-3"
          >
            {services.map(
              (service) => (
                <option
                  key={service.id}
                  value={service.id}
                >
                  {service.name}
                </option>
              )
            )}
          </select>


          <select
            value={priceSource}
            onChange={(event) =>
              setPriceSource(
                event.target.value
              )
            }
            className="rounded-xl border border-[#d7e1da] bg-white px-4 py-3"
          >
            {languages.map(
              (language) => (
                <option
                  key={language.id}
                  value={language.id}
                >
                  {language.name}
                </option>
              )
            )}
          </select>


          <select
            value={priceTarget}
            onChange={(event) =>
              setPriceTarget(
                event.target.value
              )
            }
            className="rounded-xl border border-[#d7e1da] bg-white px-4 py-3"
          >
            {languages.map(
              (language) => (
                <option
                  key={language.id}
                  value={language.id}
                >
                  {language.name}
                </option>
              )
            )}
          </select>


          <input
            value={specialPrice}
            onChange={(event) =>
              setSpecialPrice(
                event.target.value
              )
            }
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Price (£)"
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
                  "add_language_price",

                serviceId:
                  priceService,

                sourceLanguageId:
                  priceSource,

                targetLanguageId:
                  priceTarget,

                price:
                  specialPrice,
              });

            if (ok) {
              setSpecialPrice("");
            }
          }}
          className="mt-4 rounded-xl bg-[#087f5b] px-6 py-3 font-semibold text-white disabled:opacity-50"
        >
          Add / Update Price
        </button>


        <div className="mt-7 overflow-x-auto">

          <table className="w-full text-left text-sm">

            <thead className="bg-[#f3f7f4]">
              <tr>
                <th className="px-4 py-3">
                  Service
                </th>
                <th className="px-4 py-3">
                  From
                </th>
                <th className="px-4 py-3">
                  To
                </th>
                <th className="px-4 py-3">
                  Price
                </th>
                <th className="px-4 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>

              {languagePrices.map(
                (item) => {

                  const service =
                    services.find(
                      (value) =>
                        value.id ===
                        item.service_id
                    );

                  const source =
                    languages.find(
                      (value) =>
                        value.id ===
                        item.source_language_id
                    );

                  const target =
                    languages.find(
                      (value) =>
                        value.id ===
                        item.target_language_id
                    );


                  return (
                    <tr
                      key={item.id}
                      className="border-t border-[#edf1ee]"
                    >
                      <td className="px-4 py-3">
                        {service?.name}
                      </td>

                      <td className="px-4 py-3">
                        {source?.name}
                      </td>

                      <td className="px-4 py-3">
                        {target?.name}
                      </td>

                      <td className="px-4 py-3 font-semibold">
                        £
                        {Number(
                          item.price
                        ).toFixed(2)}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">

                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => {
                              setPriceService(
                                item.service_id
                              );

                              setPriceSource(
                                item.source_language_id
                              );

                              setPriceTarget(
                                item.target_language_id
                              );

                              setSpecialPrice(
                                String(
                                  item.price
                                )
                              );

                              window.scrollTo({
                                top: 0,
                                behavior: "smooth",
                              });
                            }}
                            className="rounded-lg border border-[#087f5b] px-4 py-2 text-sm font-semibold text-[#087f5b]"
                          >
                            Edit
                          </button>


                          <button
                            type="button"
                            disabled={saving}
                            onClick={async () => {
                              const confirmed =
                                window.confirm(
                                  "Delete this service-specific price override? The base language-pair price will be used instead."
                                );

                              if (!confirmed) {
                                return;
                              }

                              await api({
                                action:
                                  "delete_language_price",

                                id:
                                  item.id,
                              });
                            }}
                            className="rounded-lg border border-[#c94b3b] px-4 py-2 text-sm font-semibold text-[#a13a2d]"
                          >
                            Delete
                          </button>

                        </div>
                      </td>
                    </tr>

                  );
                }
              )}

            </tbody>

          </table>

        </div>

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