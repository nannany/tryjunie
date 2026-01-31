import { ReactNode, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { UserContext } from "@/contexts/UserContext.tsx";
import { createClient } from "@/lib/supabase/client.ts";

const supabase = createClient();

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUserSession = async () => {
      setIsLoading(true);
      try {
        const {
          data: { user: currentUser },
          error: fetchError,
        } = await supabase.auth.getUser();
        if (fetchError) {
          throw fetchError;
        }
        setUser(currentUser);
      } catch (e) {
        setError(e as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setUser(session?.user ?? null);
        setIsLoading(false); // Set loading to false on auth state change
      },
    );

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, isLoading, error }}>
      {children}
    </UserContext.Provider>
  );
};
