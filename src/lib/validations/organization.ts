import { z } from "zod";

export const MembershipRoleEnum = z.enum(["OWNER", "ADMIN", "MEMBER"]);

export const updateOrganizationProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(255, "Organization name must be less than 255 characters")
    .trim(),
});

export const inviteMemberSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export const updateMemberRoleSchema = z.object({
  membershipId: z.string().uuid("Invalid membership id"),
  role: MembershipRoleEnum,
});

export const removeMemberSchema = z.object({
  membershipId: z.string().uuid("Invalid membership id"),
});

export type UpdateOrganizationProfileInput = z.infer<typeof updateOrganizationProfileSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;
