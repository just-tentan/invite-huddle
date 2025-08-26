import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { ObjectUploader } from './ObjectUploader';
import { updateHostProfileSchema, type UpdateHostProfile, type Host } from '@shared/schema';
import { User, Camera, Facebook, Instagram, Twitter, Linkedin, Globe, Phone } from 'lucide-react';
import type { UploadResult } from '@uppy/core';

interface HostProfileDialogProps {
  host: Host;
  onHostUpdate: (updatedHost: Host) => void;
  children: React.ReactNode;
}

export function HostProfileDialog({ host, onHostUpdate, children }: HostProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const form = useForm<UpdateHostProfile>({
    resolver: zodResolver(updateHostProfileSchema),
    defaultValues: {
      firstName: host.firstName || '',
      lastName: host.lastName || '',
      preferredName: host.preferredName || '',
      contact: host.contact || '',
      pictureUrl: host.pictureUrl || '',
      facebookUrl: host.facebookUrl || '',
      instagramUrl: host.instagramUrl || '',
      twitterUrl: host.twitterUrl || '',
      linkedinUrl: host.linkedinUrl || '',
      websiteUrl: host.websiteUrl || '',
    },
  });

  const handleGetUploadParameters = async () => {
    try {
      const response = await fetch('/api/objects/upload', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }
      
      const data = await response.json();
      return {
        method: 'PUT' as const,
        url: data.uploadURL,
      };
    } catch (error) {
      console.error('Error getting upload parameters:', error);
      toast({
        title: 'Upload Error',
        description: 'Failed to prepare image upload. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      if (uploadedFile.uploadURL) {
        try {
          setUploading(true);
          
          // Update the picture URL in the form
          form.setValue('pictureUrl', uploadedFile.uploadURL);
          
          // Set ACL policy for the uploaded image
          const response = await fetch('/api/host-pictures', {
            method: 'PUT',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              pictureUrl: uploadedFile.uploadURL,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to set picture ACL');
          }

          const data = await response.json();
          form.setValue('pictureUrl', data.objectPath);
          
          toast({
            title: 'Picture Uploaded',
            description: 'Your profile picture has been uploaded successfully.',
          });
        } catch (error) {
          console.error('Error setting picture ACL:', error);
          toast({
            title: 'Upload Error',
            description: 'Failed to process uploaded picture. Please try again.',
            variant: 'destructive',
          });
        } finally {
          setUploading(false);
        }
      }
    }
  };

  const onSubmit = async (data: UpdateHostProfile) => {
    try {
      const response = await fetch('/api/host/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedHost = await response.json();
      onHostUpdate(updatedHost);
      setOpen(false);
      
      toast({
        title: 'Profile Updated',
        description: 'Your host profile has been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update your profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Host Profile</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Profile Picture */}
            <div className="flex flex-col items-center space-y-4">
              {form.watch('pictureUrl') ? (
                <img
                  src={form.watch('pictureUrl')}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-border"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={5242880} // 5MB
                onGetUploadParameters={handleGetUploadParameters}
                onComplete={handleUploadComplete}
                buttonClassName="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                {uploading ? 'Uploading...' : 'Upload Picture'}
              </ObjectUploader>
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="preferredName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Name</FormLabel>
                  <FormControl>
                    <Input placeholder="How you'd like to be called" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact</FormLabel>
                  <FormControl>
                    <Input placeholder="Phone number or additional contact" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Social Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Social Links</h3>
              
              <FormField
                control={form.control}
                name="facebookUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Facebook className="h-4 w-4" />
                      Facebook
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="https://facebook.com/username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instagramUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Instagram className="h-4 w-4" />
                      Instagram
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="https://instagram.com/username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="twitterUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Twitter className="h-4 w-4" />
                      Twitter
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="https://twitter.com/username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="linkedinUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4" />
                      LinkedIn
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="https://linkedin.com/in/username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Website
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="https://yourwebsite.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={uploading}
                data-testid="button-save-profile"
              >
                Save Profile
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}