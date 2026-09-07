"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/client";


export default function TranslatorLogout() {
  const router =
    useRouter();

  const [loading, setLoading] =
    useState(false);


  async function logout() {
    setLoading(true);

    const supabase =
      createClient();

    await supabase.auth
      .signOut();

    router.push(
      "/translator/login"
    );

    router.refresh();
  }


  return (
    <button
      type="button"
      disabled={loading}
      onClick={logout}
      className="rounded-xl border border-[#d5e0d8] bg-white px-4 py-2 text-sm font-semibold text-[#26372e] transition hover:bg-[#f4f8f5] disabled:opacity-50"
    >
      {loading
        ? "Signing out..."
        : "Sign out"}
    </button>
  );
}