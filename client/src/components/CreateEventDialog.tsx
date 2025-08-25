import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Minus } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventCreated: () => void;
}

export const CreateEventDialog = ({ open, onOpenChange, onEventCreated }: CreateEventDialogProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    guests: [{ email: '', name: '' }],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      guests: [{ email: '', name: '' }],
    });
  };

  const addGuestField = () => {
    setFormData(prev => ({ ...prev, guests: [...prev.guests, { email: '', name: '' }] }));
  };

  const removeGuestField = (index: number) => {
    setFormData(prev => ({ 
      ...prev, 
      guests: prev.guests.filter((_, i) => i !== index)
    }));
  };

  const updateGuest = (index: number, field: 'email' | 'name', value: string) => {
    setFormData(prev => ({
      ...prev,
      guests: prev.guests.map((guest, i) => i === index ? { ...guest, [field]: value } : guest)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.date || !formData.time) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Combine date and time
      const dateTime = new Date(`${formData.date}T${formData.time}`);
      
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          dateTime: dateTime.toISOString(),
          location: formData.location || null,
          guests: formData.guests.filter(guest => guest.email.trim()).map(guest => ({
            email: guest.email.trim(),
            name: guest.name.trim() || null
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create event');
      }

      toast({
        title: "Event Created",
        description: "Your event has been created successfully!",
      });

      resetForm();
      onOpenChange(false);
      onEventCreated();
    } catch (error: any) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            Set up a new private event and invite your guests.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              placeholder="Summer BBQ Party"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Join us for a fun summer BBQ with great food and company!"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="123 Main St, City, State"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Guest Invitations</Label>
            <div className="space-y-3">
              {formData.guests.map((guest, index) => (
                <div key={index} className="space-y-2 p-3 border rounded-md">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Guest Name (optional)"
                        value={guest.name}
                        onChange={(e) => updateGuest(index, 'name', e.target.value)}
                        data-testid={`input-guest-name-${index}`}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        placeholder="guest@example.com"
                        value={guest.email}
                        onChange={(e) => updateGuest(index, 'email', e.target.value)}
                        type="email"
                        data-testid={`input-guest-email-${index}`}
                      />
                    </div>
                    {formData.guests.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeGuestField(index)}
                        data-testid={`button-remove-guest-${index}`}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                    {index === formData.guests.length - 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={addGuestField}
                        data-testid="button-add-guest"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Add guest names and email addresses to send personalized invitations. Names are optional but make emails more personal.
            </p>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};