import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";

export function useCurrentUserName() {
  const [userName, setUserName] = useState<string>("User");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setUserName(user.email.split("@")[0]);
      }
    });
  }, []);

  return userName;
}
