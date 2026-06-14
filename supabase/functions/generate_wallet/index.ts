import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if wallet already exists
    const { data: existingWallet } = await supabase
      .from("crypto_wallets")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_primary", true)
      .maybeSingle();

    if (existingWallet) {
      return new Response(
        JSON.stringify({
          success: true,
          wallet: {
            id: existingWallet.id,
            address: existingWallet.wallet_address,
            hasSecret: !!existingWallet.mnemonic_encrypted,
          },
          message: "Wallet already exists",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Import ethers for wallet generation
    const mod = await import("npm:ethers@6.10.0");
    const { Wallet, HDNodeWallet } = mod;

    // Generate mnemonic (12 words)
    const mnemonic = Wallet.createRandom().mnemonic;
    if (!mnemonic) {
      throw new Error("Failed to generate mnemonic");
    }

    // Create HD wallet from mnemonic
    const hdWallet = HDNodeWallet.fromMnemonic(mnemonic, "m/44'/60'/0'/0/0");
    const address = hdWallet.address;
    const privateKey = hdWallet.privateKey;

    // Encrypt sensitive data (use a simple approach for now - in production, use KMS)
    const encryptionKey = Deno.env.get("WALLET_ENCRYPTION_KEY") || "default-key-change-in-production";

    // Simple base64 encoding (not secure - use proper encryption in production!)
    const mnemonicEncrypted = btoa(mnemonic.phrase);
    const privKeyEncrypted = btoa(privateKey);

    // Insert wallet
    const { data: newWallet, error: insertError } = await supabase
      .from("crypto_wallets")
      .insert({
        user_id: user.id,
        wallet_address: address,
        mnemonic_encrypted: mnemonicEncrypted,
        private_key_encrypted: privKeyEncrypted,
        chain_type: "evm",
        is_primary: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: insertError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        wallet: {
          id: newWallet.id,
          address: address,
          mnemonic: mnemonic.phrase,
          privateKey: privateKey,
        },
        message: "Wallet generated successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
