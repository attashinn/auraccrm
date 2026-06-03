import { auth, currentUser, createClerkClient } from "@clerk/nextjs/server";
import type { Membership, Organization, User, MembershipRole } from "@prisma/client";
import { db } from "@/lib/db";
import { mapClerkRoleToPrisma } from "@/lib/clerk-roles";

export type ActiveContext = {
  org: Organization;
  user: User;
  membership: Membership;
  clerkOrgId: string;
  clerkUserId: string;
};

async function getClerkClient() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Server misconfiguration: CLERK_SECRET_KEY is not set.");
  }
  return createClerkClient({ secretKey });
}

async function resolveClerkMembershipRole(clerkOrgId: string, clerkUserId: string): Promise<MembershipRole> {
  try {
    const clerk = await getClerkClient();
    const { data } = await clerk.organizations.getOrganizationMembershipList({
      organizationId: clerkOrgId,
    });
    const clerkMembership = data.find((m) => m.publicUserData?.userId === clerkUserId);
    if (!clerkMembership) return "MEMBER";
    return mapClerkRoleToPrisma(clerkMembership.role);
  } catch {
    return "MEMBER";
  }
}

export async function ensureDbRecordsSynced(userId: string, orgId: string) {
  let dbUser = await db.user.findUnique({ where: { clerkId: userId } });

  if (!dbUser) {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      throw new Error("Clerk Sync Conflict: Unable to fetch authenticated user details from Clerk.");
    }

    const email = clerkUser.emailAddresses?.[0]?.emailAddress;
    if (!email) {
      throw new Error("Clerk Sync Conflict: User lacks a primary email address.");
    }

    dbUser = await db.user.create({
      data: {
        clerkId: userId,
        email,
        firstName: clerkUser.firstName || "",
        lastName: clerkUser.lastName || "",
      },
    });
  }

  let dbOrg = await db.organization.findUnique({ where: { clerkId: orgId } });

  if (!dbOrg) {
    const clerk = await getClerkClient();
    const clerkOrg = await clerk.organizations.getOrganization({ organizationId: orgId });
    const slug = clerkOrg.slug ?? `org-${orgId.slice(-8)}`;

    dbOrg = await db.organization.create({
      data: {
        clerkId: orgId,
        name: clerkOrg.name,
        slug,
      },
    });
  }

  let dbMembership = await db.membership.findUnique({
    where: {
      unique_user_org: {
        userId: dbUser.id,
        organizationId: dbOrg.id,
      },
    },
  });

  const clerkRole = await resolveClerkMembershipRole(orgId, userId);

  if (!dbMembership) {
    const memberCount = await db.membership.count({ where: { organizationId: dbOrg.id } });
    const initialRole =
      memberCount === 0 && clerkRole === "ADMIN" ? ("OWNER" as const) : clerkRole;

    dbMembership = await db.membership.create({
      data: {
        userId: dbUser.id,
        organizationId: dbOrg.id,
        role: initialRole,
      },
    });
  } else if (dbMembership.role !== clerkRole) {
    dbMembership = await db.membership.update({
      where: { id: dbMembership.id },
      data: { role: clerkRole },
    });
  }

  return {
    org: dbOrg,
    user: dbUser,
    membership: dbMembership,
  };
}

/** Authenticated tenant context with self-healing Clerk ↔ Prisma sync. */
export async function getActiveContext(): Promise<ActiveContext> {
  const { orgId, userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized: Please sign in to access this resource.");
  }

  if (!orgId) {
    throw new Error("Action Restricted: You must belong to and select an active organization workspace.");
  }

  const { org, user, membership } = await ensureDbRecordsSynced(userId, orgId);

  return {
    org,
    user,
    membership,
    clerkOrgId: orgId,
    clerkUserId: userId,
  };
}

/** Backward-compatible helper used by CRM resource actions. */
export async function getActiveOrg(): Promise<Organization> {
  const { org } = await getActiveContext();
  return org;
}
