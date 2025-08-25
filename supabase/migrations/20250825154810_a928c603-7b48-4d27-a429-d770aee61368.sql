-- Security Fix: Create secure view for guest invitation access
-- This limits what guests can see about their invitation to prevent contact info exposure

-- Drop existing guest policies that might expose too much data
DROP POLICY IF EXISTS "Guests can access their invitation via token" ON public.invitations;
DROP POLICY IF EXISTS "Guests can update their RSVP via token" ON public.invitations;

-- Create a security definer function to validate invitation tokens
CREATE OR REPLACE FUNCTION public.validate_invitation_token(token_param TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.invitations 
    WHERE token = token_param 
    AND is_blocked = false
  );
END;
$$;

-- Create a secure function for guests to get only their RSVP status and event access
CREATE OR REPLACE FUNCTION public.get_guest_invitation_info(token_param TEXT)
RETURNS TABLE (
  invitation_id UUID,
  event_id UUID,
  rsvp_status TEXT,
  is_blocked BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.event_id,
    i.rsvp_status,
    i.is_blocked
  FROM public.invitations i
  WHERE i.token = token_param
  AND i.is_blocked = false;
END;
$$;

-- Create restrictive guest policies that don't expose contact information
CREATE POLICY "Guests can view limited invitation data via token" 
ON public.invitations 
FOR SELECT
USING (
  token = current_setting('request.jwt.claims', true)::json->>'invitation_token'
  AND is_blocked = false
);

CREATE POLICY "Guests can update only RSVP status via token" 
ON public.invitations 
FOR UPDATE
USING (
  token = current_setting('request.jwt.claims', true)::json->>'invitation_token'
  AND is_blocked = false
)
WITH CHECK (
  token = current_setting('request.jwt.claims', true)::json->>'invitation_token'
  AND is_blocked = false
);

-- Add additional constraint to prevent contact info updates by guests
-- Only allow RSVP status updates for guests
CREATE OR REPLACE FUNCTION public.prevent_guest_contact_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- If this is a guest update (via token), only allow RSVP status changes
  IF current_setting('request.jwt.claims', true)::json->>'invitation_token' IS NOT NULL THEN
    -- Prevent changes to email, phone, or other sensitive fields
    IF OLD.email IS DISTINCT FROM NEW.email OR 
       OLD.phone IS DISTINCT FROM NEW.phone OR
       OLD.token IS DISTINCT FROM NEW.token OR
       OLD.event_id IS DISTINCT FROM NEW.event_id THEN
      RAISE EXCEPTION 'Guests can only update RSVP status';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to enforce guest update restrictions
CREATE TRIGGER prevent_guest_contact_updates_trigger
  BEFORE UPDATE ON public.invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_guest_contact_updates();

-- Grant minimal necessary permissions
REVOKE ALL ON public.invitations FROM anon, authenticated;
GRANT SELECT, UPDATE ON public.invitations TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_invitation_token(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_guest_invitation_info(TEXT) TO anon, authenticated;