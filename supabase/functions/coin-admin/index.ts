import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const { action, admin_username, target_username, amount } = await req.json();

    // Validate inputs
    if (!action || !admin_username || !target_username || amount == null) {
      return new Response(JSON.stringify({ error: "Eksik parametre" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["give", "take"].includes(action)) {
      return new Response(JSON.stringify({ error: "Geçersiz işlem" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsedAmount = Math.floor(Number(amount));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return new Response(JSON.stringify({ error: "Geçersiz miktar" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (parsedAmount > 100000) {
      return new Response(JSON.stringify({ error: "Maksimum 100.000 coin gönderilebilir" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin is_op
    const { data: admin, error: adminErr } = await supabase
      .from("players")
      .select("username, is_op")
      .eq("username", admin_username)
      .single();

    if (adminErr || !admin || !admin.is_op) {
      return new Response(JSON.stringify({ error: "Yetkiniz yok" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check target exists
    const { data: target, error: targetErr } = await supabase
      .from("players")
      .select("username, coins")
      .eq("username", target_username)
      .single();

    if (targetErr || !target) {
      return new Response(JSON.stringify({ error: "Oyuncu bulunamadı" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let newCoins: number;
    if (action === "give") {
      newCoins = target.coins + parsedAmount;
    } else {
      if (target.coins < parsedAmount) {
        return new Response(JSON.stringify({ error: `Oyuncunun yeterli coini yok. Mevcut: ${target.coins}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      newCoins = target.coins - parsedAmount;
    }

    // Update coins
    const { error: updateErr } = await supabase
      .from("players")
      .update({ coins: newCoins })
      .eq("username", target_username);

    if (updateErr) {
      return new Response(JSON.stringify({ error: "Güncelleme başarısız" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log transaction
    await supabase.from("coin_transactions").insert({
      admin_username,
      target_username,
      amount: parsedAmount,
      action,
    });

    return new Response(JSON.stringify({
      success: true,
      message: `${target_username} oyuncusuna ${parsedAmount} coin ${action === "give" ? "verildi" : "çekildi"}. Yeni bakiye: ${newCoins}`,
      new_balance: newCoins,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: "Sunucu hatası" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
