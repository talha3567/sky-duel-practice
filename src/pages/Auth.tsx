import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Gamepad2 } from "lucide-react";

const Auth = () => {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast({ title: "Hata", description: "6 haneli kodu eksiksiz giriniz", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("verify-code", {
        body: { code },
      });

      if (fnError || !data?.success) {
        toast({
          title: "Doğrulama Hatası",
          description: data?.error || "Geçersiz veya süresi dolmuş kod",
          variant: "destructive",
        });
        setCode("");
        setIsLoading(false);
        return;
      }

      // Use the token_hash to sign in via OTP verification
      const { error: otpError } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: "magiclink",
      });

      if (otpError) {
        toast({
          title: "Giriş Hatası",
          description: "Oturum açılamadı. Lütfen tekrar deneyin.",
          variant: "destructive",
        });
        setCode("");
      } else {
        toast({
          title: "Hoş geldiniz!",
          description: `${data.minecraft_username} olarak giriş yaptınız.`,
        });
        navigate("/");
      }
    } catch {
      toast({
        title: "Hata",
        description: "Bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
      setCode("");
    }

    setIsLoading(false);
  };

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (code.length === 6 && !isLoading) {
      handleVerify();
    }
  }, [code]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Geri Dön</span>
      </Link>

      <Card className="w-full max-w-md glass-card border-border/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center">
            <Gamepad2 className="w-8 h-8 text-green-500" />
          </div>
          <CardTitle className="text-3xl font-bold">SMPPRAC</CardTitle>
          <CardDescription className="text-muted-foreground">
            Minecraft hesabınızla giriş yapın
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-secondary/30 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">Nasıl giriş yapılır?</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Minecraft sunucusuna bağlanın</li>
              <li>
                Oyun içinde <code className="bg-secondary px-1.5 py-0.5 rounded text-green-500 font-mono">/doğrula</code> yazın
              </li>
              <li>Chatinizde beliren <span className="text-green-500 font-bold">6 haneli kodu</span> aşağıya girin</li>
              <li>Kodun süresi <span className="text-yellow-500 font-medium">5 dakikadır</span></li>
            </ol>
          </div>

          <div className="flex flex-col items-center gap-4">
            <p className="text-sm font-medium text-foreground">Doğrulama Kodunu Girin</p>
            <InputOTP
              maxLength={6}
              value={code}
              onChange={setCode}
              disabled={isLoading}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            onClick={handleVerify}
            className="w-full"
            disabled={isLoading || code.length !== 6}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Doğrulanıyor...
              </>
            ) : (
              "Giriş Yap"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
