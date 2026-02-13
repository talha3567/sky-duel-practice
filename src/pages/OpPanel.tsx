import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Shield, LogIn, Search, Ban, ShieldCheck, ShieldOff, UserCheck } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface UserData {
  id: string;
  username: string | null;
  minecraft_username: string | null;
  banned: boolean;
  is_op: boolean;
  created_at: string;
}

const OpPanel = () => {
  const [loginUsername, setLoginUsername] = useState("");
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleLogin = async () => {
    const trimmed = loginUsername.trim();
    if (!trimmed) return;

    const { data } = await supabase
      .from("players")
      .select("username, is_op")
      .eq("username", trimmed)
      .single();

    if (!data) { toast.error("Oyuncu bulunamadı"); return; }
    if (!data.is_op) { toast.error("Bu panele erişim yetkiniz yok"); return; }

    setLoggedInUser(data.username);
    toast.success(`Hoş geldin, ${data.username}!`);
    fetchUsers(data.username);
  };

  const fetchUsers = async (adminUsername: string) => {
    setLoading(true);
    const res = await supabase.functions.invoke("op-admin", {
      body: { action: "list_users", admin_username: adminUsername },
    });
    if (res.data?.users) setUsers(res.data.users);
    setLoading(false);
  };

  const handleAction = async (action: string, targetUsername: string) => {
    if (!loggedInUser) return;
    setActionLoading(`${action}-${targetUsername}`);

    const res = await supabase.functions.invoke("op-admin", {
      body: { action, admin_username: loggedInUser, target_username: targetUsername },
    });

    if (res.data?.success) {
      toast.success(res.data.message);
      fetchUsers(loggedInUser);
    } else {
      toast.error(res.data?.error || "İşlem başarısız");
    }
    setActionLoading(null);
  };

  const filteredUsers = users.filter(u =>
    (u.minecraft_username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.username || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!loggedInUser) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="w-full max-w-sm space-y-6 p-8 rounded-2xl border border-border/50 bg-card shadow-xl">
            <div className="text-center space-y-2">
              <Shield className="w-12 h-12 mx-auto text-primary" />
              <h1 className="text-2xl font-bold">OP Panel Giriş</h1>
              <p className="text-sm text-muted-foreground">Minecraft kullanıcı adınızı girin</p>
            </div>
            <div className="space-y-4">
              <Input
                placeholder="Minecraft kullanıcı adı"
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 pt-28 pb-12 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              OP Yönetim Paneli
            </h1>
            <p className="text-muted-foreground mt-1">
              Giriş: <span className="font-semibold text-foreground">{loggedInUser}</span>
            </p>
          </div>
          <Button variant="outline" onClick={() => setLoggedInUser(null)}>Çıkış</Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Minecraft kullanıcı adı ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Minecraft Adı</TableHead>
                <TableHead>Görünen Ad</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>OP</TableHead>
                <TableHead>Kayıt Tarihi</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Yükleniyor...</TableCell></TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Kullanıcı bulunamadı</TableCell></TableRow>
              ) : (
                filteredUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-mono font-medium">{u.minecraft_username || "-"}</TableCell>
                    <TableCell>{u.username || "-"}</TableCell>
                    <TableCell>
                      {u.banned ? (
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-red-500/20 text-red-400">Banlı</span>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-green-500/20 text-green-400">Aktif</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.is_op ? (
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-500/20 text-yellow-400">OP</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(u.created_at).toLocaleDateString("tr-TR")}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {u.minecraft_username && u.minecraft_username !== loggedInUser && (
                        <>
                          <Button
                            size="sm"
                            variant={u.banned ? "outline" : "destructive"}
                            onClick={() => handleAction(u.banned ? "unban" : "ban", u.minecraft_username!)}
                            disabled={actionLoading === `${u.banned ? "unban" : "ban"}-${u.minecraft_username}`}
                          >
                            {u.banned ? <><UserCheck className="w-3 h-3 mr-1" />Unban</> : <><Ban className="w-3 h-3 mr-1" />Ban</>}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(u.is_op ? "demote" : "promote", u.minecraft_username!)}
                            disabled={actionLoading === `${u.is_op ? "demote" : "promote"}-${u.minecraft_username}`}
                          >
                            {u.is_op ? <><ShieldOff className="w-3 h-3 mr-1" />OP Kaldır</> : <><ShieldCheck className="w-3 h-3 mr-1" />OP Yap</>}
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default OpPanel;
