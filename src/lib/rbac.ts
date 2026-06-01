import type { MembershipRole } from "@prisma/client";

export function canEditOrganizationProfile(actorRole: MembershipRole): boolean {
  return actorRole === "OWNER" || actorRole === "ADMIN";
}

export function canInviteMembers(actorRole: MembershipRole): boolean {
  return actorRole === "OWNER" || actorRole === "ADMIN";
}

/** Roles the actor may assign when inviting or updating members. */
export function getAssignableRoles(actorRole: MembershipRole): MembershipRole[] {
  if (actorRole === "OWNER") return ["OWNER", "ADMIN", "MEMBER"];
  if (actorRole === "ADMIN") return ["ADMIN", "MEMBER"];
  return [];
}

export function canAssignRole(actorRole: MembershipRole, newRole: MembershipRole): boolean {
  return getAssignableRoles(actorRole).includes(newRole);
}

export type MemberActionPermissions = {
  canRemove: boolean;
  canChangeRole: boolean;
  allowedRoles: MembershipRole[];
  reason?: string;
};

export function getMemberActionPermissions(
  actorRole: MembershipRole,
  actorMembershipId: string,
  target: { id: string; role: MembershipRole },
  ownerCount: number
): MemberActionPermissions {
  const allowedRoles = getAssignableRoles(actorRole).filter((role) => {
    if (role === "OWNER" && target.role !== "OWNER" && ownerCount >= 1) {
      return actorRole === "OWNER";
    }
    return true;
  });

  if (actorRole === "MEMBER") {
    return {
      canRemove: false,
      canChangeRole: false,
      allowedRoles: [],
      reason: "Members have read-only access to team settings.",
    };
  }

  if (target.id === actorMembershipId) {
    return {
      canRemove: false,
      canChangeRole: false,
      allowedRoles: [],
      reason: "You cannot modify your own membership.",
    };
  }

  if (actorRole === "ADMIN" && target.role === "OWNER") {
    return {
      canRemove: false,
      canChangeRole: false,
      allowedRoles: [],
      reason: "Only owners can manage owner accounts.",
    };
  }

  if (actorRole === "ADMIN" && target.role === "ADMIN") {
    return {
      canRemove: false,
      canChangeRole: false,
      allowedRoles: [],
      reason: "Admins can only manage members.",
    };
  }

  if (target.role === "OWNER" && ownerCount <= 1) {
    return {
      canRemove: false,
      canChangeRole: false,
      allowedRoles: [],
      reason: "The organization must retain at least one owner.",
    };
  }

  return {
    canRemove: true,
    canChangeRole: true,
    allowedRoles,
  };
}

export function assertCanAssignRole(
  actorRole: MembershipRole,
  newRole: MembershipRole,
  targetCurrentRole: MembershipRole,
  ownerCount: number
): void {
  if (!canAssignRole(actorRole, newRole)) {
    throw new Error("Forbidden: You cannot assign this role.");
  }

  if (targetCurrentRole === "OWNER" && newRole !== "OWNER" && ownerCount <= 1) {
    throw new Error("Forbidden: Cannot demote the only owner of the organization.");
  }

  if (newRole === "OWNER" && actorRole !== "OWNER") {
    throw new Error("Forbidden: Only owners can grant owner privileges.");
  }
}

export function assertCanRemoveMember(
  actorRole: MembershipRole,
  actorMembershipId: string,
  target: { id: string; role: MembershipRole },
  ownerCount: number
): void {
  const perms = getMemberActionPermissions(actorRole, actorMembershipId, target, ownerCount);
  if (!perms.canRemove) {
    throw new Error(perms.reason ?? "Forbidden: You cannot remove this member.");
  }
}
