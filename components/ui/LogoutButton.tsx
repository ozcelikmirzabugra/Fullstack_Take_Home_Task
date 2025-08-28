"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut();
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleLogout}
      disabled={isLoading}
    >
      {isLoading ? "Logging out..." : "Logout"}
    </Button>
  );
}
