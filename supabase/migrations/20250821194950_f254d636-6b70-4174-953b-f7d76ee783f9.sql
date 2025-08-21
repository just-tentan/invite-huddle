-- Create hosts table for verified host accounts
CREATE TABLE public.hosts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(email)
);

-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL REFERENCES public.hosts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invitations table with unique tokens
CREATE TABLE public.invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  email TEXT,
  phone TEXT,
  rsvp_status TEXT CHECK (rsvp_status IN ('pending', 'yes', 'no', 'maybe')) DEFAULT 'pending',
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT email_or_phone CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- Create event messages table for chat
CREATE TABLE public.event_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('host', 'guest')),
  sender_id UUID, -- host_id for hosts, invitation_id for guests
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.hosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hosts table
CREATE POLICY "Hosts can view and update their own profile" 
ON public.hosts 
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for events table
CREATE POLICY "Hosts can manage their own events" 
ON public.events 
FOR ALL
USING (host_id IN (SELECT id FROM public.hosts WHERE user_id = auth.uid()))
WITH CHECK (host_id IN (SELECT id FROM public.hosts WHERE user_id = auth.uid()));

-- Allow guests to view events if they have a valid invitation
CREATE POLICY "Guests can view events they're invited to" 
ON public.events 
FOR SELECT
USING (
  id IN (
    SELECT event_id FROM public.invitations 
    WHERE token = current_setting('request.jwt.claims', true)::json->>'invitation_token'
    AND is_blocked = false
  )
);

-- RLS Policies for invitations table
CREATE POLICY "Hosts can manage invitations for their events" 
ON public.invitations 
FOR ALL
USING (
  event_id IN (
    SELECT e.id FROM public.events e 
    JOIN public.hosts h ON e.host_id = h.id 
    WHERE h.user_id = auth.uid()
  )
)
WITH CHECK (
  event_id IN (
    SELECT e.id FROM public.events e 
    JOIN public.hosts h ON e.host_id = h.id 
    WHERE h.user_id = auth.uid()
  )
);

-- Allow guests to view and update their own invitation via token
CREATE POLICY "Guests can access their invitation via token" 
ON public.invitations 
FOR SELECT
USING (token = current_setting('request.jwt.claims', true)::json->>'invitation_token');

CREATE POLICY "Guests can update their RSVP via token" 
ON public.invitations 
FOR UPDATE
USING (token = current_setting('request.jwt.claims', true)::json->>'invitation_token')
WITH CHECK (token = current_setting('request.jwt.claims', true)::json->>'invitation_token');

-- RLS Policies for event messages
CREATE POLICY "Hosts can manage messages in their events" 
ON public.event_messages 
FOR ALL
USING (
  event_id IN (
    SELECT e.id FROM public.events e 
    JOIN public.hosts h ON e.host_id = h.id 
    WHERE h.user_id = auth.uid()
  )
)
WITH CHECK (
  event_id IN (
    SELECT e.id FROM public.events e 
    JOIN public.hosts h ON e.host_id = h.id 
    WHERE h.user_id = auth.uid()
  )
);

-- Allow guests to view and post messages if they have valid invitation
CREATE POLICY "Guests can view messages if invited" 
ON public.event_messages 
FOR SELECT
USING (
  event_id IN (
    SELECT event_id FROM public.invitations 
    WHERE token = current_setting('request.jwt.claims', true)::json->>'invitation_token'
    AND is_blocked = false
  )
);

CREATE POLICY "Guests can post messages if invited and not blocked" 
ON public.event_messages 
FOR INSERT
WITH CHECK (
  event_id IN (
    SELECT event_id FROM public.invitations 
    WHERE token = current_setting('request.jwt.claims', true)::json->>'invitation_token'
    AND is_blocked = false
  )
);

-- Create function to auto-create host profile on user signup
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
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name')
  );
  RETURN NEW;
END;
$$;

-- Trigger to create host profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to generate unique invitation tokens
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_hosts_updated_at
BEFORE UPDATE ON public.hosts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invitations_updated_at
BEFORE UPDATE ON public.invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for chat messages
ALTER TABLE public.event_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_messages;