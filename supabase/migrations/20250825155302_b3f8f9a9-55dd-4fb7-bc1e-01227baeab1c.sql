-- Security Fix: Strengthen host table access controls
-- Replace the broad ALL policy with specific policies for better security

-- Drop the existing broad policy
DROP POLICY IF EXISTS "Hosts can view and update their own profile" ON public.hosts;

-- Create specific restrictive policies for hosts table
-- Only authenticated users can SELECT their own host profile
CREATE POLICY "Authenticated hosts can view own profile" 
ON public.hosts 
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only authenticated users can INSERT their own host profile  
CREATE POLICY "Authenticated hosts can create own profile" 
ON public.hosts 
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Only authenticated users can UPDATE their own host profile
CREATE POLICY "Authenticated hosts can update own profile" 
ON public.hosts 
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Only authenticated users can DELETE their own host profile
CREATE POLICY "Authenticated hosts can delete own profile" 
ON public.hosts 
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Explicitly deny all access to anonymous users
CREATE POLICY "Deny anonymous access to hosts" 
ON public.hosts 
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Additional security: Create a function to validate host profile updates
CREATE OR REPLACE FUNCTION public.validate_host_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Prevent email changes if verified
  IF OLD.verified = true AND OLD.email IS DISTINCT FROM NEW.email THEN
    RAISE EXCEPTION 'Cannot change email address of verified host';
  END IF;
  
  -- Prevent user_id changes
  IF OLD.user_id IS DISTINCT FROM NEW.user_id THEN
    RAISE EXCEPTION 'Cannot change user_id of host profile';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply validation trigger
CREATE TRIGGER validate_host_profile_update_trigger
  BEFORE UPDATE ON public.hosts
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_host_profile_update();

-- Revoke unnecessary permissions and grant minimal required access
REVOKE ALL ON public.hosts FROM public, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hosts TO authenticated;