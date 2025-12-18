'use server'

import { getCurrentUser } from "@/data/user/user-auth";

export async function getNavUser() {
  const user = await getCurrentUser();
  
  if (!user) {
    return null;
  }

  return {
    name: user.name || '',
    email: user.email || '',
  };
}

