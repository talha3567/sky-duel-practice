
-- Players tablosu
CREATE TABLE public.players (
  id SERIAL PRIMARY KEY,
  username VARCHAR(16) UNIQUE NOT NULL,
  coins INTEGER NOT NULL DEFAULT 0,
  is_op BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Coin işlem logları
CREATE TABLE public.coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_username VARCHAR(16) NOT NULL,
  target_username VARCHAR(16) NOT NULL,
  amount INTEGER NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('give', 'take')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

-- Players herkes okuyabilsin (username ile giriş kontrolü için)
CREATE POLICY "Players readable by everyone" ON public.players FOR SELECT USING (true);

-- Coin transactions sadece service role
CREATE POLICY "Transactions viewable by everyone" ON public.coin_transactions FOR SELECT USING (true);
CREATE POLICY "Only service role can insert transactions" ON public.coin_transactions FOR INSERT WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY "Only service role can update players" ON public.players FOR UPDATE USING ((auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY "Only service role can insert players" ON public.players FOR INSERT WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');
