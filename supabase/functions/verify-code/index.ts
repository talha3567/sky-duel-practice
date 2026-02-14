import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();

    if (!code || typeof code !== "string" || !/^\d{6}$/.test(code)) {
      return new Response(JSON.stringify({ error: "Geçersiz kod formatı" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find valid, unused, non-expired code
    const { data: verificationCode, error: fetchError } = await supabase
      .from("verification_codes")
      .select("*")
      .eq("code", code)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !verificationCode) {
      return new Response(JSON.stringify({ error: "Geçersiz veya süresi dolmuş kod" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mcUsername = verificationCode.minecraft_username;

    // Mark code as used
    await supabase
      .from("verification_codes")
      .update({ used: true })
      .eq("id", verificationCode.id);

    // Check if user already exists in profiles
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("minecraft_username", mcUsername)
      .maybeSingle();

    let userId: string;
    const generatedEmail = `${mcUsername.toLowerCase()}@mc.smpprac.local`;

    if (existingProfile) {
      // User exists - just sign them in
      userId = existingProfile.user_id;
    } else {
      // Create new user with auto-generated email and random password
      const randomPassword = crypto.randomUUID() + crypto.randomUUID();
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: generatedEmail,
        password: randomPassword,
        email_confirm: true,
        user_metadata: {
          username: mcUsername,
          minecraft_username: mcUsername,
        },
      });

      if (createError || !newUser.user) {
        console.error("Create user error:", createError);
        return new Response(JSON.stringify({ error: "Hesap oluşturulamadı" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      userId = newUser.user.id;
    }

    // Generate magic link for sign-in
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: generatedEmail,
    });

    if (linkError || !linkData) {
      console.error("Generate link error:", linkError);
      return new Response(JSON.stringify({ error: "Giriş bağlantısı oluşturulamadı" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract token hash from the generated link properties
    const tokenHash = linkData.properties?.hashed_token;
    
    if (!tokenHash) {
      console.error("No hashed_token in link data:", JSON.stringify(linkData));
      return new Response(JSON.stringify({ error: "Token oluşturulamadı" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        token_hash: tokenHash,
        minecraft_username: mcUsername,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Verify code error:", err);
    return new Response(JSON.stringify({ error: "Sunucu hatası" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
