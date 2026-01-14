// Load environment variables FIRST before any other imports
import { config } from "dotenv";
import { expand } from "dotenv-expand";
import * as path from "path";
import * as fs from "fs";

// Load .env file from project root
const envPath = path.join(process.cwd(), ".env");
const envResult = config({ path: envPath });
expand(envResult);

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set in environment variables.");
  console.error("   Please check your .env file.");
  
  // Check if .env file exists
  if (fs.existsSync(envPath)) {
    console.error(`\n   .env file exists at: ${envPath}`);
    console.error("   But DATABASE_URL is not being loaded.");
    console.error("   Please verify the .env file contains DATABASE_URL=...");
    
    // Try to read and check if DATABASE_URL exists
    try {
      const envContent = fs.readFileSync(envPath, "utf-8");
      const hasDatabaseUrl = envContent.includes("DATABASE_URL");
      if (hasDatabaseUrl) {
        console.error("\n   ⚠️  DATABASE_URL found in .env file but not loaded.");
        console.error("   This might be a formatting issue. Check for:");
        console.error("   - No spaces around the = sign");
        console.error("   - No quotes unless needed");
        console.error("   - Line starts with DATABASE_URL (not commented with #)");
      } else {
        console.error("\n   ⚠️  DATABASE_URL not found in .env file.");
        console.error("   Please add: DATABASE_URL=postgresql://username:password@host:port/database");
      }
    } catch (err) {
      console.error("\n   Could not read .env file:", err);
    }
  } else {
    console.error(`\n   .env file not found at: ${envPath}`);
    console.error("   Please create a .env file with DATABASE_URL.");
    console.error("   Expected format: DATABASE_URL=postgresql://username:password@host:port/database");
  }
  process.exit(1);
}

/**
 * Script to create and verify the default user using Better Auth API
 * Email: sirof@gmail.com
 * Password: Sirof2025@
 * 
 * This script:
 * 1. Creates the user using Better Auth's internal API (if user doesn't exist)
 * 2. Sets emailVerified to true so the user can login immediately
 */
async function createDefaultUser() {
  try {
    const email = "sirof@gmail.com";
    const password = "Sirof2025@";
    const name = "Sirof Admin";

    console.log("🚀 Creating/verifying default user using Better Auth API...");
    console.log("📧 Email:", email);
    console.log("🔐 Password:", password);
    console.log("✅ Will set emailVerified to true\n");

    // Import Better Auth and database dependencies
    const { auth } = await import("@/lib/auth");
    const { db } = await import("@/db");
    const { user, account } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    
    // Check if user already exists
    const existingUsers = await db.select().from(user).where(eq(user.email, email)).limit(1);
    let existingUser = existingUsers[0] || null;

    if (existingUser) {
      console.log("✅ User already exists:", existingUser.name || existingUser.email);
      
      // Check if email is already verified
      if (existingUser.emailVerified) {
        console.log("✅ Email is already verified!");
        console.log("\n🎉 User is ready to login!");
        console.log("📧 Email:", email);
        console.log("✅ Email verified: true");
        return;
      }

      // Update emailVerified to true
      console.log("📧 Setting emailVerified to true in database...");
      await db
        .update(user)
        .set({ emailVerified: true, updatedAt: new Date() })
        .where(eq(user.id, existingUser.id));

      console.log("✅ Email verified set to true!");
      console.log("\n🎉 User is ready to login!");
      console.log("📧 Email:", email);
      console.log("✅ Email verified: true");
      return;
    }

    // User doesn't exist, create using Better Auth's internal API
    console.log("👤 User doesn't exist. Creating new user using Better Auth API...");
    
    // Try to use Better Auth's API if available
    let createdUser;
    try {
      // Try using auth.api.createUser if available
      if ((auth as any).api?.createUser) {
        console.log("📝 Using Better Auth API to create user...");
        const result = await (auth as any).api.createUser({
          body: {
            email: email.toLowerCase(),
            password: password,
            name: name,
            emailVerified: false, // Will be set to true below
          },
        });
        createdUser = result?.user || result;
      } else {
        // Fallback: Use internal adapter directly
        console.log("📝 Using Better Auth internal adapter to create user...");
        const internalAdapter = (auth as any).internalAdapter;
        if (!internalAdapter) {
          throw new Error("Better Auth internal adapter not available");
        }

        // Create user using Better Auth's internal adapter
        createdUser = await internalAdapter.createUser({
          email: email.toLowerCase(),
          name: name,
          emailVerified: false, // Will be set to true below
        });

        if (!createdUser) {
          throw new Error("Failed to create user using Better Auth internal adapter");
        }

        // Create account with password using Better Auth's password hashing
        const authContext = (auth as any).context;
        if (!authContext?.password?.hash) {
          throw new Error("Better Auth password hashing context not available");
        }

        const passwordHash = await authContext.password.hash(password);

        // Create account with hashed password
        const { generateId } = await import("@/lib/data-table/id");
        const accountId = generateId();
        
        await db.insert(account).values({
          id: accountId,
          accountId: accountId,
          providerId: "credential",
          userId: createdUser.id,
          password: passwordHash,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        console.log("✅ Account created with Better Auth password hash!");
      }
    } catch (error) {
      console.error("❌ Error creating user with Better Auth API:", error);
      throw error;
    }

    if (!createdUser) {
      throw new Error("Failed to create user using Better Auth API");
    }

    console.log("✅ User created using Better Auth API!");

    // Update emailVerified to true so user can login immediately
    console.log("📧 Setting emailVerified to true in database...");
    await db
      .update(user)
      .set({ emailVerified: true, updatedAt: new Date() })
      .where(eq(user.id, createdUser.id));

    console.log("✅ Email verified set to true!");
    console.log("\n🎉 Default user created and verified successfully!");
    console.log("📧 Email:", email);
    console.log("🔐 Password:", password);
    console.log("✅ Email verified: true");
    console.log("\n✨ User can now login immediately!");
    
  } catch (error) {
    console.error("❌ Error creating/verifying user:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    throw error;
  }
}


// Run the script
createDefaultUser()
  .then(() => {
    console.log("\n✨ Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });

