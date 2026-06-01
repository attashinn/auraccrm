import type { MembershipRole } from "@prisma/client";

/** Map Clerk organization role strings to Prisma MembershipRole. */
export function mapClerkRoleToPrisma(clerkRole: string): MembershipRole {
  const normalized = clerkRole.toLowerCase();
  if (normalized === "org:owner" || normalized === "owner") return "OWNER";
  if (normalized === "org:admin" || normalized === "admin") return "ADMIN";
  return "MEMBER";
}

/** Map Prisma role to Clerk API role (Clerk supports org:admin and org:member). */
export function mapPrismaRoleToClerk(role: MembershipRole): "org:admin" | "org:member" {
  if (role === "MEMBER") return "org:member";
  return "org:admin";
}

export function formatMemberName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  email: string
): string {
  const full = [firstName, lastName].filter(Boolean).join(" ").trim();
  return full || email.split("@")[0] || "Member";
}
