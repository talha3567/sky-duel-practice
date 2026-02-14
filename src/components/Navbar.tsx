import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, User, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setAvatarUrl(null);
      setUsername(null);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("profiles")
      .select("avatar_url, username")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setAvatarUrl(data.avatar_url);
      setUsername(data.username);
    }
  };

  const navLinks = [
    { to: "/", label: "Anasayfa" },
    { to: "/leaderboard", label: "Liderlik" },
    ...(user ? [{ to: "/op-panel", label: "OP Panel" }] : []),
    ...(user ? [{ to: "/coin-admin", label: "Coin Admin" }] : []),
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "glass-card border-b border-border/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="text-xl font-bold tracking-tight hover:opacity-80 transition-opacity"
          >
            SMPPRAC
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
            
            {user ? (
              <Link to="/profile">
                <div className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <Avatar className="w-8 h-8 border border-border/50">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="bg-secondary text-foreground text-sm">
                      {username?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{username || "Profil"}</span>
                </div>
              </Link>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm" className="border-border/50 hover:bg-secondary">
                  <LogIn className="w-4 h-4 mr-2" />
                  Giriş
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-2 animate-fade-in">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full text-left px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
            
            {user ? (
              <Link
                to="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 w-full text-left px-4 py-3 text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
              >
                <Avatar className="w-6 h-6 border border-border/50">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="bg-secondary text-foreground text-xs">
                    {username?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                {username || "Profil"}
              </Link>
            ) : (
              <Link
                to="/auth"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full text-left px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
              >
                <LogIn className="w-4 h-4 inline mr-2" />
                Giriş Yap
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
