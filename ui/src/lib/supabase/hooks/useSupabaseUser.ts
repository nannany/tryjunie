import { useContext } from "react";
import { UserContext } from "../../../contexts/UserContext"; // Adjusted path

// The UseSupabaseUserReturn interface is implicitly defined by UserContextType, so it's removed.
// Also removing User from @supabase/supabase-js and createClient as they are no longer used here.

export const useSupabaseUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useSupabaseUser must be used within a UserProvider");
  }
  return context; // This will return { user, isLoading, error }
};
