import { db } from "./lib/db";

async function main() {
  console.log("Checking database organizations...");
  const orgs = await db.organization.findMany();
  console.log("Organizations in DB:", JSON.stringify(orgs, null, 2));

  console.log("Checking database users...");
  const users = await db.user.findMany();
  console.log("Users in DB:", JSON.stringify(users, null, 2));

  console.log("Checking database memberships...");
  const memberships = await db.membership.findMany();
  console.log("Memberships in DB:", JSON.stringify(memberships, null, 2));
}

main().catch(console.error);
