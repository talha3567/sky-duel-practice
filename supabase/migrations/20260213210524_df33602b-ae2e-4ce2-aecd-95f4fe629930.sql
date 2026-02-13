
-- Add minecraft_username and banned columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS minecraft_username VARCHAR(16) UNIQUE,
ADD COLUMN IF NOT EXISTS banned BOOLEAN NOT NULL DEFAULT false;

-- Create index for fast minecraft_username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_minecraft_username ON public.profiles(minecraft_username);

-- Create trigger to prevent minecraft_username updates after initial set
CREATE OR REPLACE FUNCTION public.prevent_minecraft_username_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.minecraft_username IS NOT NULL AND NEW.minecraft_username IS DISTINCT FROM OLD.minecraft_username THEN
    RAISE EXCEPTION 'Minecraft username cannot be changed once set';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_minecraft_username_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_minecraft_username_change();

-- Update handle_new_user to also store minecraft_username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_username TEXT;
  mc_username TEXT;
BEGIN
  clean_username := TRIM(COALESCE(new.raw_user_meta_data ->> 'username', ''));
  mc_username := TRIM(COALESCE(new.raw_user_meta_data ->> 'minecraft_username', ''));
  
  -- Validate display username
  IF LENGTH(clean_username) < 3 OR LENGTH(clean_username) > 20 THEN
    RAISE EXCEPTION 'Username must be between 3 and 20 characters';
  END IF;
  IF clean_username !~ '^[a-zA-Z0-9_-]+$' THEN
    RAISE EXCEPTION 'Username can only contain letters, numbers, underscores and hyphens';
  END IF;
  
  -- Validate minecraft username
  IF LENGTH(mc_username) < 3 OR LENGTH(mc_username) > 16 THEN
    RAISE EXCEPTION 'Minecraft username must be between 3 and 16 characters';
  END IF;
  IF mc_username !~ '^[a-zA-Z0-9_]+$' THEN
    RAISE EXCEPTION 'Minecraft username can only contain letters, numbers and underscores';
  END IF;
  
  INSERT INTO public.profiles (user_id, username, minecraft_username)
  VALUES (new.id, clean_username, mc_username);
  
  RETURN new;
END;
$$;
