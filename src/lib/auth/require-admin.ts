import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function requireAdmin() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/admin/login");
  }

  const { data: adminUser, error: adminError } =
    await supabaseAdmin
      .from("admin_users")
      .select("user_id, role, is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

  if (adminError || !adminUser) {
    redirect("/admin/login");
  }

  return {
    user,
    adminUser,
  };
}