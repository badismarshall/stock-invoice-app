import postgres from "postgres";
import { config } from "dotenv";
import { expand } from "dotenv-expand";
import * as fs from "fs";
import * as path from "path";

// Load .env file manually first
expand(config());

async function testConnection() {
  console.log("🔌 Testing database connection...\n");
  
  // Check both parsed env and process.env
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error("❌ DATABASE_URL is not set in environment variables.");
    console.error("   Please check your .env file.");
    console.error("   Make sure DATABASE_URL is defined in your .env file.");
    console.error("\n   Expected format:");
    console.error("   DATABASE_URL=postgresql://username:password@host:port/database");
    
    // Check if .env file exists
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      console.error(`\n   .env file exists at: ${envPath}`);
      console.error("   But DATABASE_URL is not being loaded.");
      console.error("   Please verify the .env file contains DATABASE_URL=...");
      
      // Try to read and show first few lines (without sensitive data)
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
        }
      } catch {
        // Couldn't read file, skip
      }
    } else {
      console.error(`\n   .env file not found at: ${envPath}`);
      console.error("   Please create a .env file with DATABASE_URL.");
    }
    process.exit(1);
  }
  
  // Parse URL to show connection details (without password)
  try {
    // Replace postgresql:// with http:// for URL parsing
    const urlForParsing = dbUrl.replace(/^postgres(ql)?:\/\//, "http://");
    const url = new URL(urlForParsing);
    
    console.log("📋 Connection Details:");
    console.log(`   Host: ${url.hostname}`);
    console.log(`   Port: ${url.port || "5432 (default)"}`);
    console.log(`   Username: ${url.username || "(not set)"}`);
    console.log(`   Password: ${url.password ? "***" : "(not set)"}`);
    console.log(`   Database: ${url.pathname.slice(1) || "(not set)"}`);
    console.log("");
    
    if (!url.username) {
      console.error("❌ Username is missing from DATABASE_URL");
      console.error("   Format: postgresql://username:password@host:port/database");
      process.exit(1);
    }
    
    if (!url.password) {
      console.error("❌ Password is missing from DATABASE_URL");
      console.error("   Format: postgresql://username:password@host:port/database");
      process.exit(1);
    }
    
    if (!url.pathname || url.pathname === "/") {
      console.error("❌ Database name is missing from DATABASE_URL");
      console.error("   Format: postgresql://username:password@host:port/database");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Invalid DATABASE_URL format");
    console.error("   Expected format: postgresql://username:password@host:port/database");
    console.error(`   Your URL: ${dbUrl.substring(0, 50)}...`);
    process.exit(1);
  }
  
  // Try to connect
  console.log("🔄 Attempting to connect...");
  let connection: postgres.Sql | null = null;
  
  try {
    connection = postgres(dbUrl, {
      max: 1,
      connect_timeout: 5,
    });
    
    await connection`SELECT 1`;
    console.log("✅ Connection successful!");
    console.log("   Your database credentials are correct.");
    
  } catch (error: any) {
    console.error("❌ Connection failed!");
    
    if (error?.message?.includes("password authentication failed")) {
      console.error("\n💡 Authentication Error:");
      console.error("   The username or password is incorrect.");
      console.error("   Please verify:");
      console.error("   1. The username in DATABASE_URL matches your PostgreSQL user");
      console.error("   2. The password is correct");
      console.error("   3. The user has permission to access the database");
    } else if (error?.message?.includes("does not exist")) {
      console.error("\n💡 Database Error:");
      console.error("   The database does not exist.");
      console.error("   Please create it first or update DATABASE_URL with the correct database name.");
    } else if (error?.message?.includes("ECONNREFUSED") || error?.message?.includes("timeout")) {
      console.error("\n💡 Connection Error:");
      console.error("   Cannot connect to PostgreSQL server.");
      console.error("   Please verify:");
      console.error("   1. PostgreSQL is running");
      console.error("   2. The host and port are correct");
      console.error("   3. Firewall allows connections");
    } else {
      console.error("\n💡 Error details:");
      console.error(`   ${error?.message || error}`);
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testConnection();

