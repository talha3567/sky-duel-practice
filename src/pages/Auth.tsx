import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";

const loginSchema = z.object({
  identifier: z.string().min(3, "En az 3 karakter giriniz"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
});

const signupSchema = z.object({
  email: z.string().email("Geçerli bir email adresi giriniz"),
  username: z.string()
    .min(3, "Kullanıcı adı en az 3 karakter olmalıdır")
    .max(20, "Kullanıcı adı en fazla 20 karakter olabilir")
    .regex(/^[a-zA-Z0-9_-]+$/, "Sadece harf, rakam, alt çizgi ve tire kullanılabilir"),
  minecraft_username: z.string()
    .min(3, "Minecraft kullanıcı adı en az 3 karakter olmalıdır")
    .max(16, "Minecraft kullanıcı adı en fazla 16 karakter olabilir")
    .regex(/^[a-zA-Z0-9_]+$/, "Sadece harf, rakam ve alt çizgi kullanılabilir"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ["confirmPassword"],
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [minecraftUsername, setMinecraftUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const getAuthErrorMessage = (error: { message?: string }, context: 'login' | 'signup'): string => {
    const message = error.message || '';
    if (message.includes('Invalid login credentials')) return 'Email/kullanıcı adı veya şifre hatalı';
    if (message.includes('Email not confirmed')) return 'Lütfen emailinizi onaylayın';
    if (message.includes('already registered')) return 'Bu email adresi zaten kayıtlı';
    if (message.includes('Password should be at least')) return 'Şifre en az 6 karakter olmalıdır';
    if (message.includes('Invalid email')) return 'Geçersiz email adresi';
    if (message.includes('User not found')) return 'Email/kullanıcı adı veya şifre hatalı';
    if (message.includes('Minecraft username')) return 'Minecraft kullanıcı adı 3-16 karakter, sadece harf/rakam/_ olmalıdır';
    if (message.includes('duplicate key') && message.includes('minecraft_username')) return 'Bu Minecraft kullanıcı adı zaten kullanılıyor';
    return context === 'login' ? 'Email/kullanıcı adı veya şifre hatalı' : 'Kayıt işlemi başarısız oldu. Lütfen tekrar deneyin.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const validation = loginSchema.safeParse({ identifier, password });
        if (!validation.success) {
          toast({ title: "Hata", description: validation.error.errors[0].message, variant: "destructive" });
          setIsLoading(false);
          return;
        }

        let loginEmail = identifier;

        // If identifier is not an email, look up the email from minecraft_username
        if (!identifier.includes("@")) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_id")
            .eq("minecraft_username", identifier)
            .maybeSingle();

          if (!profile) {
            toast({ title: "Giriş Hatası", description: "Oyuncu bulunamadı", variant: "destructive" });
            setIsLoading(false);
            return;
          }

          // Get the user's email via edge function
          const { data: userData } = await supabase.functions.invoke("get-user-email", {
            body: { user_id: profile.user_id },
          });

          if (!userData?.email) {
            toast({ title: "Giriş Hatası", description: "Kullanıcı bilgisi alınamadı", variant: "destructive" });
            setIsLoading(false);
            return;
          }
          loginEmail = userData.email;
        }

        const { error } = await signIn(loginEmail, password);
        if (error) {
          toast({ title: "Giriş Hatası", description: getAuthErrorMessage(error, 'login'), variant: "destructive" });
        } else {
          toast({ title: "Hoş geldiniz!", description: "Başarıyla giriş yaptınız." });
          navigate("/");
        }
      } else {
        const validation = signupSchema.safeParse({ email, password, confirmPassword, username, minecraft_username: minecraftUsername });
        if (!validation.success) {
          toast({ title: "Hata", description: validation.error.errors[0].message, variant: "destructive" });
          setIsLoading(false);
          return;
        }

        // Check minecraft_username uniqueness
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("minecraft_username", minecraftUsername)
          .maybeSingle();

        if (existing) {
          toast({ title: "Hata", description: "Bu Minecraft kullanıcı adı zaten kullanılıyor", variant: "destructive" });
          setIsLoading(false);
          return;
        }

        const { error } = await signUp(email, password, username, minecraftUsername);
        if (error) {
          toast({ title: "Kayıt Hatası", description: getAuthErrorMessage(error, 'signup'), variant: "destructive" });
        } else {
          toast({ title: "Kayıt Başarılı!", description: "Hesabınız oluşturuldu. Email onayı gerekebilir." });
        }
      }
    } catch {
      toast({ title: "Hata", description: "Bir hata oluştu. Lütfen tekrar deneyin.", variant: "destructive" });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-5 h-5" />
        <span>Geri Dön</span>
      </Link>
      
      <Card className="w-full max-w-md glass-card border-border/20">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">SMPPRAC</CardTitle>
          <CardDescription className="text-muted-foreground">
            {isLogin ? "Hesabınıza giriş yapın" : "Yeni hesap oluşturun"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isLogin ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="identifier">Minecraft Kullanıcı Adı veya Email</Label>
                  <Input id="identifier" type="text" placeholder="username veya ornek@email.com" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="bg-secondary/50 border-border/30" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Şifre</Label>
                  <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-secondary/50 border-border/30" />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="minecraft_username">Minecraft Kullanıcı Adı</Label>
                  <Input id="minecraft_username" type="text" placeholder="Steve_123" value={minecraftUsername} onChange={(e) => setMinecraftUsername(e.target.value)} className="bg-secondary/50 border-border/30" maxLength={16} />
                  <p className="text-xs text-muted-foreground">⚠️ Kayıt sonrası değiştirilemez!</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Görünen Ad</Label>
                  <Input id="username" type="text" placeholder="xPro_Gamer47" value={username} onChange={(e) => setUsername(e.target.value)} className="bg-secondary/50 border-border/30" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="ornek@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-secondary/50 border-border/30" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Şifre</Label>
                  <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-secondary/50 border-border/30" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
                  <Input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="bg-secondary/50 border-border/30" />
                </div>
              </>
            )}
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Lütfen bekleyin...</> : (isLogin ? "Giriş Yap" : "Kayıt Ol")}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              {isLogin ? "Hesabınız yok mu?" : "Zaten hesabınız var mı?"}
              <button onClick={() => setIsLogin(!isLogin)} className="ml-2 text-foreground hover:underline font-medium">
                {isLogin ? "Kayıt Ol" : "Giriş Yap"}
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
