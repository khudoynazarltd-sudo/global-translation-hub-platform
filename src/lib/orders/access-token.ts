import { createHash, randomBytes } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

export function hashOrderAccessToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createOrderAccessToken(orderId: string) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashOrderAccessToken(token);

  const { error } = await supabaseAdmin
    .from("order_access_tokens")
    .insert({
      order_id: orderId,
      token_hash: tokenHash,
      expires_at: null,
    });

  if (error) {
    console.error("Order access token creation failed:", error);
    throw new Error("Unable to create secure order access.");
  }

  return token;
}