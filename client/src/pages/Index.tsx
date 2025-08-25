// Removed react-router-dom import
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Shield, MessageCircle, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    window.location.href = '/dashboard';
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">EventHost</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create private group events with secure invitations, RSVP tracking, and real-time chat.
            Like Meetup, but more minimal and private.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" asChild>
              <a href="/auth">Get Started</a>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Shield className="h-8 w-8 mx-auto mb-2 text-primary" />
              <CardTitle className="text-lg">Private Events</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Events are private and only accessible to invited guests with unique links.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
              <CardTitle className="text-lg">Easy Invitations</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Send invitations via email or phone. No login required for guests to RSVP.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <CardTitle className="text-lg">RSVP Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Track Yes, No, and Maybe responses from your guests in real-time.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <MessageCircle className="h-8 w-8 mx-auto mb-2 text-primary" />
              <CardTitle className="text-lg">Event Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Each event has its own private chat room for hosts and invited guests.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Ready to host your first event?</CardTitle>
            <CardDescription>
              Join EventHost and create memorable private gatherings with ease.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button size="lg" asChild>
              <a href="/auth">Start Hosting Events</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
