import { createClerkClient } from "@clerk/nextjs/server";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  console.log("Clerk Secret Key:", secretKey ? "FOUND" : "MISSING");

  createClerkClient({ secretKey });
  console.log("Clerk Client initialized successfully.");
}

main().catch(console.error);
