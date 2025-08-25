import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, MapPin, Clock, Users, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { EventChat } from '../components/EventChat';

interface Event {
  id: string;
  title: string;
  description: string | null;
  dateTime: string;
  location: string | null;
}

interface InvitationData {
  id: string;
  token: string;
  email: string | null;
  name: string | null;
  rsvpStatus: "pending" | "yes" | "no" | "maybe";
  eventId: string;
}

const Invitation = () => {
  const { token } = useParams<{ token: string }>();
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (token) {
      fetchInvitation();
    }
  }, [token]);

  const fetchInvitation = async () => {
    try {
      const response = await fetch(`/api/invitations/${token}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setInvitation(data.invitation);
        setEvent(data.event);
      } else if (response.status === 404) {
        setError("Invitation not found. The link may be invalid or expired.");
      } else {
        setError("Unable to load invitation details.");
      }
    } catch (error) {
      console.error('Error fetching invitation:', error);
      setError("Network error occurred while loading invitation.");
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (status: "yes" | "no" | "maybe") => {
    if (!token) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/invitations/${token}/rsvp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ rsvpStatus: status }),
      });

      if (response.ok) {
        setInvitation(prev => prev ? { ...prev, rsvpStatus: status } : null);
        toast({
          title: "RSVP Updated",
          description: `Thank you for your response! You've RSVP'd "${status.toUpperCase()}".`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update RSVP. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating RSVP:', error);
      toast({
        title: "Error",
        description: "Network error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle className="text-destructive">Invitation Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.href = '/'} variant="outline">
              Go to EventHost
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle>Invitation Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">This invitation does not exist or has expired.</p>
            <Button onClick={() => window.location.href = '/'} variant="outline">
              Go to EventHost
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">EventHost</h1>
          <p className="text-muted-foreground">Event Invitation</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Event Details */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">{event.title}</CardTitle>
                <CardDescription className="text-base">
                  You've been invited to this private event
                </CardDescription>
              </div>
              {invitation.rsvpStatus !== 'pending' && (
                <Badge variant={invitation.rsvpStatus === 'yes' ? 'default' : 'secondary'} className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  RSVP: {invitation.rsvpStatus.toUpperCase()}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {event.description && (
              <p className="text-muted-foreground">{event.description}</p>
            )}
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{formatDate(event.dateTime)}</span>
              </div>
              
              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{event.location}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* RSVP Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Your RSVP
            </CardTitle>
            <CardDescription>
              Please let the host know if you can attend
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => handleRSVP('yes')}
                disabled={isSubmitting}
                variant={invitation.rsvpStatus === 'yes' ? 'default' : 'outline'}
                className="flex-1 min-w-[100px]"
              >
                Yes, I'll be there
              </Button>
              <Button
                onClick={() => handleRSVP('maybe')}
                disabled={isSubmitting}
                variant={invitation.rsvpStatus === 'maybe' ? 'default' : 'outline'}
                className="flex-1 min-w-[100px]"
              >
                Maybe
              </Button>
              <Button
                onClick={() => handleRSVP('no')}
                disabled={isSubmitting}
                variant={invitation.rsvpStatus === 'no' ? 'default' : 'outline'}
                className="flex-1 min-w-[100px]"
              >
                Can't attend
              </Button>
            </div>
            
            {invitation.rsvpStatus !== 'pending' && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm text-center">
                  ✨ Thank you for your response! The host has been notified of your RSVP.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event Chat - Only show after RSVP */}
        {invitation.rsvpStatus !== 'pending' && invitation.rsvpStatus !== 'no' && (
          <EventChat eventId={event.id} invitationToken={token!} />
        )}
      </div>
    </div>
  );
};

export default Invitation;