-- Add name fields to hosts and invitations tables for better user experience
-- This will allow showing names instead of just email addresses

-- Add name field to hosts table
ALTER TABLE public.hosts ADD COLUMN IF NOT EXISTS name TEXT;

-- Add name field to invitations table 
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS name TEXT;

-- Update the handle_new_user function to use name from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.hosts (user_id, email, name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;