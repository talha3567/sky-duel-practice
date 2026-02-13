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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, admin_username, target_username } = await req.json();

    if (!action || !admin_username) {
      return new Response(JSON.stringify({ error: "Eksik parametre" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify admin is_op
    const { data: admin } = await supabase
      .from("players")
      .select("username, is_op")
      .eq("username", admin_username)
      .single();

    if (!admin?.is_op) {
      return new Response(JSON.stringify({ error: "Yetkiniz yok" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // List all users
    if (action === "list_users") {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, minecraft_username, banned, created_at")
        .order("created_at", { ascending: false });

      // Get is_op info from players table
      const { data: players } = await supabase
        .from("players")
        .select("username, is_op");

      const opMap = new Map(players?.map(p => [p.username, p.is_op]) || []);

      const users = (profiles || []).map(p => ({
        ...p,
        is_op: opMap.get(p.minecraft_username || "") ?? false,
      }));

      return new Response(JSON.stringify({ users }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ban/unban
    if (action === "ban" || action === "unban") {
      if (!target_username) {
        return new Response(JSON.stringify({ error: "Hedef kullanıcı gerekli" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: target } = await supabase
        .from("profiles")
        .select("id")
        .eq("minecraft_username", target_username)
        .single();

      if (!target) {
        return new Response(JSON.stringify({ error: "Oyuncu bulunamadı" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase
        .from("profiles")
        .update({ banned: action === "ban" })
        .eq("minecraft_username", target_username);

      if (error) {
        return new Response(JSON.stringify({ error: "İşlem başarısız" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: `${target_username} ${action === "ban" ? "banlandı" : "ban kaldırıldı"}`,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Promote/demote OP
    if (action === "promote" || action === "demote") {
      if (!target_username) {
        return new Response(JSON.stringify({ error: "Hedef kullanıcı gerekli" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: player } = await supabase
        .from("players")
        .select("id")
        .eq("username", target_username)
        .single();

      if (!player) {
        return new Response(JSON.stringify({ error: "Oyuncu players tablosunda bulunamadı" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase
        .from("players")
        .update({ is_op: action === "promote" })
        .eq("username", target_username);

      if (error) {
        return new Response(JSON.stringify({ error: "İşlem başarısız" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: `${target_username} ${action === "promote" ? "OP yapıldı" : "OP kaldırıldı"}`,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Geçersiz işlem" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Sunucu hatası" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
