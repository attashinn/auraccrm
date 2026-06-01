import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { db } from "@/lib/db";

// ─── Types ───────────────────────────────────────────────────────────────────

type ClerkUserPayload = {
  id: string;
  email_addresses: { email_address: string }[];
  first_name: string | null;
  last_name: string | null;
};

type ClerkOrgPayload = {
  id: string;
  name: string;
  slug: string | null;
};

type ClerkMembershipPayload = {
  role: string;
  organization: { id: string };
  public_user_data: { user_id: string };
};

// ─── POST /api/webhooks/clerk ─────────────────────────────────────────────────

export async function POST(req: Request) {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("[WEBHOOK] Incoming request to /api/webhooks/clerk");

  // ── Step 1: Read raw body for Svix signature verification ──────────────────
  let rawBody: string;
  try {
    rawBody = await req.text();
    console.log("[WEBHOOK] Step 1 ✅ Raw body read successfully");
    console.log("[WEBHOOK] Body length:", rawBody.length);
  } catch (err) {
    console.error("[WEBHOOK] Step 1 ❌ Failed to read raw body:", err);
    return NextResponse.json({ error: "Failed to read request body" }, { status: 400 });
  }

  // ── Step 2: Check Svix signature headers ───────────────────────────────────
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  console.log("[WEBHOOK] Step 2 – Svix headers present:", {
    "svix-id": svixId ? "✅" : "❌ MISSING",
    "svix-timestamp": svixTimestamp ? "✅" : "❌ MISSING",
    "svix-signature": svixSignature ? "✅" : "❌ MISSING",
  });

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error("[WEBHOOK] Step 2 ❌ Missing Svix headers — request rejected");
    return NextResponse.json({ error: "Missing Svix signature headers" }, { status: 400 });
  }

  // ── Step 3: Check CLERK_WEBHOOK_SECRET ─────────────────────────────────────
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  console.log("[WEBHOOK] Step 3 – CLERK_WEBHOOK_SECRET present:", webhookSecret ? "✅" : "❌ MISSING");

  if (!webhookSecret) {
    console.error("[WEBHOOK] Step 3 ❌ CLERK_WEBHOOK_SECRET env variable not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  // ── Step 4: Verify Svix signature ──────────────────────────────────────────
  let event: { type: string; data: unknown };
  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(rawBody, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as { type: string; data: unknown };
    console.log("[WEBHOOK] Step 4 ✅ Svix signature VERIFIED");
  } catch (err) {
    console.error("[WEBHOOK] Step 4 ❌ Svix signature verification FAILED:", err);
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  // ── Step 5: Parse event ─────────────────────────────────────────────────────
  const { type, data } = event;
  console.log(`[WEBHOOK] Step 5 ✅ Event type: "${type}"`);
  console.log("[WEBHOOK] Event data (truncated):", JSON.stringify(data).slice(0, 200));

  // ── Step 6: Route by event type ────────────────────────────────────────────
  try {
    switch (type) {

      // ── user.created / user.updated ────────────────────────────────────────
      case "user.created":
      case "user.updated": {
        console.log(`[WEBHOOK] Handling ${type}...`);
        const d = data as ClerkUserPayload;

        const clerkId = d.id;
        const email = d.email_addresses?.[0]?.email_address;
        const firstName = d.first_name ?? "";
        const lastName = d.last_name ?? "";

        console.log("[WEBHOOK] User data:", { clerkId, email, firstName, lastName });

        if (!clerkId || !email) {
          console.error("[WEBHOOK] ❌ Missing clerkId or email — aborting upsert");
          return NextResponse.json({ error: "Missing required user fields" }, { status: 422 });
        }

        console.log("[WEBHOOK] Calling db.user.upsert...");
        const user = await db.user.upsert({
          where: { clerkId },
          update: { email, firstName, lastName },
          create: { clerkId, email, firstName, lastName },
        });

        console.log(`[WEBHOOK] Step 6 ✅ ${type} — Upserted user in Neon DB:`, {
          id: user.id,
          clerkId: user.clerkId,
          email: user.email,
        });

        return NextResponse.json({ success: true, userId: user.id }, { status: 200 });
      }

      // ── user.deleted ───────────────────────────────────────────────────────
      case "user.deleted": {
        console.log("[WEBHOOK] Handling user.deleted...");
        const d = data as { id: string };

        await db.user.deleteMany({ where: { clerkId: d.id } });

        console.log(`[WEBHOOK] ✅ Deleted user with clerkId: ${d.id}`);
        return NextResponse.json({ success: true }, { status: 200 });
      }

      // ── organization.created / organization.updated ────────────────────────
      case "organization.created":
      case "organization.updated": {
        console.log(`[WEBHOOK] Handling ${type}...`);
        const d = data as ClerkOrgPayload;

        const clerkOrgId = d.id;
        const name = d.name;
        const slug = d.slug ?? `org-${clerkOrgId.slice(-8)}`;

        console.log("[WEBHOOK] Org data:", { clerkOrgId, name, slug });
        console.log("[WEBHOOK] Calling db.organization.upsert...");

        const org = await db.organization.upsert({
          where: { clerkId: clerkOrgId },
          update: { name, slug },
          create: { clerkId: clerkOrgId, name, slug },
        });

        console.log(`[WEBHOOK] ✅ ${type} — Upserted org in Neon DB:`, {
          id: org.id,
          clerkId: org.clerkId,
          name: org.name,
        });

        return NextResponse.json({ success: true, orgId: org.id }, { status: 200 });
      }

      // ── organization.deleted ───────────────────────────────────────────────
      case "organization.deleted": {
        console.log("[WEBHOOK] Handling organization.deleted...");
        const d = data as { id: string };

        await db.organization.deleteMany({ where: { clerkId: d.id } });

        console.log(`[WEBHOOK] ✅ Deleted org with clerkId: ${d.id}`);
        return NextResponse.json({ success: true }, { status: 200 });
      }

      // ── organizationMembership.created / updated ───────────────────────────
      case "organizationMembership.created":
      case "organizationMembership.updated": {
        console.log(`[WEBHOOK] Handling ${type}...`);
        const d = data as ClerkMembershipPayload;

        const clerkOrgId = d.organization.id;
        const clerkUserId = d.public_user_data.user_id;
        const clerkRole = d.role;

        console.log("[WEBHOOK] Membership data:", { clerkOrgId, clerkUserId, clerkRole });

        const user = await db.user.findUnique({ where: { clerkId: clerkUserId } });
        const org = await db.organization.findUnique({ where: { clerkId: clerkOrgId } });

        console.log("[WEBHOOK] DB lookup:", {
          user: user ? `Found (${user.id})` : "❌ NOT FOUND — user.created webhook may not have fired yet",
          org: org ? `Found (${org.id})` : "❌ NOT FOUND — organization.created webhook may not have fired yet",
        });

        if (!user || !org) {
          console.error("[WEBHOOK] ❌ Cannot create membership — missing user or org in DB");
          return NextResponse.json(
            { error: "User or organization not yet synced to DB", user: !!user, org: !!org },
            { status: 404 }
          );
        }

        let mappedRole: "OWNER" | "ADMIN" | "MEMBER" = "MEMBER";
        if (clerkRole === "org:admin") mappedRole = "ADMIN";
        if (clerkRole === "org:owner") mappedRole = "OWNER";

        const existingMemberCount = await db.membership.count({
          where: { organizationId: org.id },
        });
        if (type === "organizationMembership.created" && existingMemberCount === 0 && mappedRole === "ADMIN") {
          mappedRole = "OWNER";
        }

        console.log(`[WEBHOOK] Mapped role: ${clerkRole} → ${mappedRole}`);
        console.log("[WEBHOOK] Calling db.membership.upsert...");

        const membership = await db.membership.upsert({
          where: { unique_user_org: { userId: user.id, organizationId: org.id } },
          update: { role: mappedRole },
          create: { userId: user.id, organizationId: org.id, role: mappedRole },
        });

        console.log(`[WEBHOOK] ✅ ${type} — Upserted membership in Neon DB:`, {
          id: membership.id,
          role: membership.role,
          userId: membership.userId,
          orgId: membership.organizationId,
        });

        return NextResponse.json({ success: true, membershipId: membership.id }, { status: 200 });
      }

      // ── organizationMembership.deleted ─────────────────────────────────────
      case "organizationMembership.deleted": {
        console.log("[WEBHOOK] Handling organizationMembership.deleted...");
        const d = data as ClerkMembershipPayload;

        const user = await db.user.findUnique({ where: { clerkId: d.public_user_data.user_id } });
        const org = await db.organization.findUnique({ where: { clerkId: d.organization.id } });

        if (user && org) {
          await db.membership.deleteMany({
            where: { userId: user.id, organizationId: org.id },
          });
          console.log(`[WEBHOOK] ✅ Deleted membership for user ${user.id} in org ${org.id}`);
        } else {
          console.warn("[WEBHOOK] ⚠️ Membership.deleted — user or org not found in DB, skipping");
        }

        return NextResponse.json({ success: true }, { status: 200 });
      }

      // ── unhandled ──────────────────────────────────────────────────────────
      default:
        console.log(`[WEBHOOK] ℹ️ Unhandled event type: "${type}" — responding 200 OK`);
        return NextResponse.json({ success: true, message: `Event "${type}" not handled` }, { status: 200 });
    }

  } catch (err) {
    console.error(`[WEBHOOK] Step 6 ❌ Handler for "${type}" threw an error:`, err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
