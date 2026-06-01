"use server";

import { createClerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import type { MembershipRole } from "@prisma/client";
import { db } from "@/lib/db";
import { getActiveContext } from "@/lib/auth-context";
import { formatMemberName, mapPrismaRoleToClerk } from "@/lib/clerk-roles";
import {
  assertCanAssignRole,
  assertCanRemoveMember,
  canEditOrganizationProfile,
  canInviteMembers,
  getMemberActionPermissions,
} from "@/lib/rbac";
import {
  inviteMemberSchema,
  removeMemberSchema,
  updateMemberRoleSchema,
  updateOrganizationProfileSchema,
} from "@/lib/validations/organization";

const ORG_PATH = "/dashboard/organization";

function getClerkClient() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Server misconfiguration: CLERK_SECRET_KEY is not set.");
  }
  return createClerkClient({ secretKey });
}

async function countOwners(organizationId: string): Promise<number> {
  return db.membership.count({
    where: { organizationId, role: "OWNER" },
  });
}

export type OrganizationMemberDto = {
  id: string;
  userId: string;
  clerkUserId: string;
  name: string;
  email: string;
  role: MembershipRole;
  joinedAt: string;
  canRemove: boolean;
  canChangeRole: boolean;
  allowedRoles: MembershipRole[];
};

export type OrganizationSettingsDto = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  currentUserRole: MembershipRole;
  permissions: {
    canEditProfile: boolean;
    canInvite: boolean;
  };
  members: OrganizationMemberDto[];
};

export async function getOrganizationSettingsAction() {
  try {
    const { org, membership } = await getActiveContext();

    const memberships = await db.membership.findMany({
      where: { organizationId: org.id },
      include: { user: true },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    });

    const ownerCount = memberships.filter((m) => m.role === "OWNER").length;

    const members: OrganizationMemberDto[] = memberships.map((m) => {
      const perms = getMemberActionPermissions(
        membership.role,
        membership.id,
        { id: m.id, role: m.role },
        ownerCount
      );

      return {
        id: m.id,
        userId: m.userId,
        clerkUserId: m.user.clerkId,
        name: formatMemberName(m.user.firstName, m.user.lastName, m.user.email),
        email: m.user.email,
        role: m.role,
        joinedAt: m.createdAt.toLocaleDateString(),
        canRemove: perms.canRemove,
        canChangeRole: perms.canChangeRole,
        allowedRoles: perms.allowedRoles,
      };
    });

    return {
      success: true as const,
      data: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        createdAt: org.createdAt.toISOString(),
        currentUserRole: membership.role,
        permissions: {
          canEditProfile: canEditOrganizationProfile(membership.role),
          canInvite: canInviteMembers(membership.role),
        },
        members,
      } satisfies OrganizationSettingsDto,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load organization settings.";
    return { success: false as const, error: message };
  }
}

export async function updateOrganizationProfileAction(input: { name: string }) {
  try {
    const { org, membership, clerkOrgId } = await getActiveContext();

    if (!canEditOrganizationProfile(membership.role)) {
      throw new Error("Forbidden: Only owners and admins can update organization profile.");
    }

    const { name } = updateOrganizationProfileSchema.parse(input);

    const clerk = getClerkClient();
    await clerk.organizations.updateOrganization(clerkOrgId, { name });

    const updated = await db.organization.update({
      where: { id: org.id },
      data: { name },
    });

    revalidatePath(ORG_PATH);

    return {
      success: true as const,
      data: {
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update organization profile.";
    return { success: false as const, error: message };
  }
}

export async function inviteMemberAction(input: { email: string; role: "ADMIN" | "MEMBER" }) {
  try {
    const { membership, clerkOrgId, clerkUserId } = await getActiveContext();

    if (!canInviteMembers(membership.role)) {
      throw new Error("Forbidden: Only owners and admins can invite members.");
    }

    const { email, role } = inviteMemberSchema.parse(input);
    const clerkRole = mapPrismaRoleToClerk(role);

    const clerk = getClerkClient();
    const invitation = await clerk.organizations.createOrganizationInvitation({
      organizationId: clerkOrgId,
      emailAddress: email,
      role: clerkRole,
      inviterUserId: clerkUserId,
    });

    revalidatePath(ORG_PATH);

    return {
      success: true as const,
      data: {
        invitationId: invitation.id,
        email: invitation.emailAddress,
        role,
        status: invitation.status,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send invitation.";
    return { success: false as const, error: message };
  }
}

export async function updateMemberRoleAction(input: { membershipId: string; role: MembershipRole }) {
  try {
    const { org, membership, clerkOrgId } = await getActiveContext();
    const { membershipId, role: newRole } = updateMemberRoleSchema.parse(input);

    const target = await db.membership.findFirst({
      where: { id: membershipId, organizationId: org.id },
      include: { user: true },
    });

    if (!target) {
      throw new Error("Member not found in this organization.");
    }

    const ownerCount = await countOwners(org.id);
    assertCanAssignRole(membership.role, newRole, target.role, ownerCount);

    const perms = getMemberActionPermissions(
      membership.role,
      membership.id,
      { id: target.id, role: target.role },
      ownerCount
    );

    if (!perms.canChangeRole) {
      throw new Error(perms.reason ?? "Forbidden: You cannot change this member's role.");
    }

    if (!perms.allowedRoles.includes(newRole)) {
      throw new Error("Forbidden: You cannot assign this role.");
    }

    const clerk = getClerkClient();
    await clerk.organizations.updateOrganizationMembership({
      organizationId: clerkOrgId,
      userId: target.user.clerkId,
      role: mapPrismaRoleToClerk(newRole),
    });

    const updated = await db.membership.update({
      where: { id: target.id },
      data: { role: newRole },
    });

    revalidatePath(ORG_PATH);

    return {
      success: true as const,
      data: {
        membershipId: updated.id,
        role: updated.role,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update member role.";
    return { success: false as const, error: message };
  }
}

export async function removeMemberAction(input: { membershipId: string }) {
  try {
    const { org, membership, clerkOrgId } = await getActiveContext();
    const { membershipId } = removeMemberSchema.parse(input);

    const target = await db.membership.findFirst({
      where: { id: membershipId, organizationId: org.id },
      include: { user: true },
    });

    if (!target) {
      throw new Error("Member not found in this organization.");
    }

    const ownerCount = await countOwners(org.id);
    assertCanRemoveMember(
      membership.role,
      membership.id,
      { id: target.id, role: target.role },
      ownerCount
    );

    const clerk = getClerkClient();
    await clerk.organizations.deleteOrganizationMembership({
      organizationId: clerkOrgId,
      userId: target.user.clerkId,
    });

    await db.membership.delete({ where: { id: target.id } });

    revalidatePath(ORG_PATH);

    return { success: true as const };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to remove member.";
    return { success: false as const, error: message };
  }
}
