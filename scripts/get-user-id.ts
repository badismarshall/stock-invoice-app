/**
 * Script to get user ID by email
 * Usage: tsx scripts/get-user-id.ts <email>
 */

import db from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

async function getUserById(email: string) {
  try {
    const users = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (users.length === 0) {
      console.log(`❌ User with email "${email}" not found`);
      return null;
    }

    const userData = users[0];
    console.log(`✅ User found:`);
    console.log(`   ID: ${userData.id}`);
    console.log(`   Name: ${userData.name}`);
    console.log(`   Email: ${userData.email}`);
    
    return userData;
  } catch (error) {
    console.error("Error getting user:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  const email = process.argv[2];
  
  if (!email) {
    console.log("Usage: tsx scripts/get-user-id.ts <email>");
    process.exit(1);
  }
  
  getUserById(email)
    .then((user) => {
      if (user) {
        console.log(`\n💡 To assign admin role, run:`);
        console.log(`   tsx scripts/init-admin-role.ts ${user.id}`);
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed:", error);
      process.exit(1);
    });
}

export { getUserById };

