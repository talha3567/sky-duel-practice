import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate API key
  const apiKey = req.headers.get("x-api-key");
  const expectedKey = Deno.env.get("MINECRAFT_API_KEY");
  if (!expectedKey || apiKey !== expectedKey) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    // Expected path: /minecraft-api/user/<username>
    const username = pathParts[pathParts.length - 1];

    if (!username || username === "minecraft-api") {
      return new Response(JSON.stringify({ error: "Username required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("minecraft_username, banned")
      .eq("minecraft_username", username)
      .maybeSingle();

    if (!profile) {
      return new Response(JSON.stringify({ exists: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check is_op from players table
    const { data: player } = await supabase
      .from("players")
      .select("is_op")
      .eq("username", username)
      .maybeSingle();

    return new Response(JSON.stringify({
      exists: true,
      minecraft_username: profile.minecraft_username,
      is_op: player?.is_op ?? false,
      banned: profile.banned,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
