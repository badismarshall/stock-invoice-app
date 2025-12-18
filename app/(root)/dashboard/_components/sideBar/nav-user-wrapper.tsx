"use client"

import { useEffect, useState, useTransition } from "react";
import { getNavUser } from "./nav-user-actions";
import { NavUser } from "./nav-user";
import { Skeleton } from "@/components/ui/skeleton";

function NavUserSkeleton() {
  return (
    <div className="flex items-center gap-2 px-2 py-2">
      <Skeleton className="h-8 w-8 rounded-lg" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

export function NavUserWrapper() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const userData = await getNavUser();
      setUser(userData);
    });
  }, []);

  if (isPending) {
    return <NavUserSkeleton />;
  }

  if (!user) {
    return null;
  }

  return <NavUser user={user} />;
}

