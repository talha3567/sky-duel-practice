import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/Navbar";
import { toast } from "sonner";
import { Coins, Send, ArrowDownCircle, LogIn, Shield, History } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const CoinAdmin = () => {
  const [loginUsername, setLoginUsername] = useState("");
  const [loggedInUser, setLoggedInUser] = useState<{ username: string; is_op: boolean } | null>(null);
  const [targetUsername, setTargetUsername] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);

  const handleLogin = async () => {
    const trimmed = loginUsername.trim();
    if (!trimmed) return;

    const { data, error } = await supabase
      .from("players")
      .select("username, is_op")
      .eq("username", trimmed)
      .single();

    if (error || !data) {
      toast.error("Oyuncu bulunamadı");
      return;
    }

    if (!data.is_op) {
      toast.error("Bu panele erişim yetkiniz yok");
      return;
    }

    setLoggedInUser(data);
    toast.success(`Hoş geldin, ${data.username}!`);
    fetchTransactions();
  };

  const fetchTransactions = async () => {
    setLoadingTx(true);
    const { data } = await supabase
      .from("coin_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setTransactions(data || []);
    setLoadingTx(false);
  };

  const handleCoinAction = async (action: "give" | "take") => {
    if (!loggedInUser || !targetUsername.trim() || !amount) return;

    const parsedAmount = parseInt(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Geçerli bir miktar girin");
      return;
    }
    if (parsedAmount > 100000) {
      toast.error("Maksimum 100.000 coin gönderilebilir");
      return;
    }

    setLoading(true);
    try {
      const res = await supabase.functions.invoke("coin-admin", {
        body: {
          action,
          admin_username: loggedInUser.username,
          target_username: targetUsername.trim(),
          amount: parsedAmount,
        },
      });

      if (res.data?.error) {
        toast.error(res.data.error);
      } else if (res.data?.success) {
        toast.success(res.data.message);
        setTargetUsername("");
        setAmount("");
        fetchTransactions();
      } else {
        toast.error("Bilinmeyen hata");
      }
    } catch {
      toast.error("Sunucu hatası");
    }
    setLoading(false);
  };

  // Login screen
  if (!loggedInUser) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="w-full max-w-sm space-y-6 p-8 rounded-2xl border border-border/50 bg-card shadow-xl">
            <div className="text-center space-y-2">
              <Shield className="w-12 h-12 mx-auto text-primary" />
              <h1 className="text-2xl font-bold">Admin Giriş</h1>
              <p className="text-sm text-muted-foreground">Minecraft kullanıcı adınızı girin</p>
            </div>
            <div className="space-y-4">
              <Input
                placeholder="Kullanıcı adı"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                maxLength={16}
              />
              <Button onClick={handleLogin} className="w-full" size="lg">
                <LogIn className="w-4 h-4 mr-2" />
                Giriş Yap
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin panel
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 pt-28 pb-12 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Coins className="w-8 h-8 text-yellow-500" />
              Coin Yönetim Paneli
            </h1>
            <p className="text-muted-foreground mt-1">
              Giriş: <span className="font-semibold text-foreground">{loggedInUser.username}</span>
            </p>
          </div>
          <Button variant="outline" onClick={() => setLoggedInUser(null)}>
            Çıkış
          </Button>
        </div>

        {/* Action Panel */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Give */}
          <div className="p-6 rounded-xl border border-border/50 bg-card space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Send className="w-5 h-5 text-green-500" />
              Coin Ver
            </h2>
            <Input
              placeholder="Hedef oyuncu"
              value={targetUsername}
              onChange={(e) => setTargetUsername(e.target.value)}
              maxLength={16}
            />
            <Input
              type="number"
              placeholder="Miktar (maks 100.000)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={1}
              max={100000}
            />
            <Button
              onClick={() => handleCoinAction("give")}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? "İşleniyor..." : "Coin Ver"}
            </Button>
          </div>

          {/* Take */}
          <div className="p-6 rounded-xl border border-border/50 bg-card space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ArrowDownCircle className="w-5 h-5 text-red-500" />
              Coin Çek
            </h2>
            <Input
              placeholder="Hedef oyuncu"
              value={targetUsername}
              onChange={(e) => setTargetUsername(e.target.value)}
              maxLength={16}
            />
            <Input
              type="number"
              placeholder="Miktar"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={1}
              max={100000}
            />
            <Button
              onClick={() => handleCoinAction("take")}
              disabled={loading}
              variant="destructive"
              className="w-full"
            >
              {loading ? "İşleniyor..." : "Coin Çek"}
            </Button>
          </div>
        </div>

        {/* Transaction History */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <History className="w-5 h-5" />
            İşlem Geçmişi
          </h2>
          <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admin</TableHead>
                  <TableHead>Hedef</TableHead>
                  <TableHead>İşlem</TableHead>
                  <TableHead>Miktar</TableHead>
                  <TableHead>Tarih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Henüz işlem yok
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">{tx.admin_username}</TableCell>
                      <TableCell>{tx.target_username}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          tx.action === "give" 
                            ? "bg-green-500/20 text-green-400" 
                            : "bg-red-500/20 text-red-400"
                        }`}>
                          {tx.action === "give" ? "Verme" : "Çekme"}
                        </span>
                      </TableCell>
                      <TableCell>{tx.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(tx.created_at).toLocaleString("tr-TR")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoinAdmin;
