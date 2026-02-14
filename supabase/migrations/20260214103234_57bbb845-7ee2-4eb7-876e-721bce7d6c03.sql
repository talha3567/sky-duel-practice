
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  clean_username TEXT;
  mc_username TEXT;
BEGIN
  clean_username := TRIM(COALESCE(new.raw_user_meta_data ->> 'username', ''));
  mc_username := TRIM(COALESCE(new.raw_user_meta_data ->> 'minecraft_username', ''));
  
  -- Skip profile creation if no username metadata (e.g. internal auth operations like generateLink)
  IF clean_username = '' OR mc_username = '' THEN
    RETURN new;
  END IF;

  -- Check if profile already exists for this user
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = new.id) THEN
    RETURN new;
  END IF;
  
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
$function$;
