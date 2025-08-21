import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

interface User {
  id: string;
  email: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        toast({
          title: "Signup Successful",
          description: "Welcome to EventHost!",
        });
        return { error: null };
      } else {
        toast({
          title: "Signup Failed",
          description: data.error,
          variant: "destructive",
        });
        return { error: { message: data.error } };
      }
    } catch (error) {
      const errorMessage = "Network error occurred";
      toast({
        title: "Signup Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return { error: { message: errorMessage } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        toast({
          title: "Sign In Successful",
          description: "Welcome back!",
        });
        return { error: null };
      } else {
        toast({
          title: "Sign In Failed",
          description: data.error,
          variant: "destructive",
        });
        return { error: { message: data.error } };
      }
    } catch (error) {
      const errorMessage = "Network error occurred";
      toast({
        title: "Sign In Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return { error: { message: errorMessage } };
    }
  };

  const signOut = async () => {
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        setUser(null);
        toast({
          title: "Signed Out",
          description: "You have been signed out successfully.",
        });
        return { error: null };
      } else {
        toast({
          title: "Sign Out Failed",
          description: "Could not sign out",
          variant: "destructive",
        });
        return { error: { message: "Could not sign out" } };
      }
    } catch (error) {
      const errorMessage = "Network error occurred";
      toast({
        title: "Sign Out Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return { error: { message: errorMessage } };
    }
  };

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };
};