"use client";

import React, { useCallback, useEffect, useState, useTransition } from "react";
import {
  Building2,
  Users2,
  ShieldAlert,
  Plus,
  Mail,
  Calendar,
  CheckCircle,
  Loader2,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  getOrganizationSettingsAction,
  inviteMemberAction,
  removeMemberAction,
  updateMemberRoleAction,
  updateOrganizationProfileAction,
  type OrganizationMemberDto,
  type OrganizationSettingsDto,
} from "@/actions/organization";
import type { MembershipRole } from "@prisma/client";

function roleBadgeVariant(role: MembershipRole): "success" | "warning" | "neutral" {
  if (role === "OWNER") return "success";
  if (role === "ADMIN") return "warning";
  return "neutral";
}

export default function OrganizationPage() {
  const [settings, setSettings] = useState<OrganizationSettingsDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [tempOrgName, setTempOrgName] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [actionError, setActionError] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<OrganizationMemberDto | null>(null);

  const showSuccess = (message: string) => {
    setSuccessMsg(message);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getOrganizationSettingsAction();
    if (!result.success) {
      setError(result.error);
      setSettings(null);
    } else {
      setSettings(result.data);
      setTempOrgName(result.data.name);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadSettings();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadSettings]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings?.permissions.canEditProfile) return;

    startTransition(async () => {
      setActionError(null);
      const result = await updateOrganizationProfileAction({ name: tempOrgName });
      if (!result.success) {
        setActionError(result.error);
        return;
      }
      await loadSettings();
      showSuccess("Workspace profile updated");
    });
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings?.permissions.canInvite) return;

    startTransition(async () => {
      setActionError(null);
      const result = await inviteMemberAction({ email: inviteEmail, role: inviteRole });
      if (!result.success) {
        setActionError(result.error);
        return;
      }
      setInviteEmail("");
      setInviteRole("MEMBER");
      setModalOpen(false);
      showSuccess(`Invitation sent to ${result.data.email}`);
    });
  };

  const handleRoleChange = (member: OrganizationMemberDto, role: MembershipRole) => {
    if (!member.canChangeRole || member.role === role) return;

    startTransition(async () => {
      setActionError(null);
      const result = await updateMemberRoleAction({ membershipId: member.id, role });
      if (!result.success) {
        setActionError(result.error);
        return;
      }
      await loadSettings();
      showSuccess("Member role updated");
    });
  };

  const handleRemoveMember = () => {
    if (!removeTarget) return;

    startTransition(async () => {
      setActionError(null);
      const result = await removeMemberAction({ membershipId: removeTarget.id });
      if (!result.success) {
        setActionError(result.error);
        return;
      }
      setRemoveTarget(null);
      await loadSettings();
      showSuccess("Member removed from workspace");
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-muted">
        <Loader2 className="h-8 w-8 animate-spin text-foreground mb-3" />
        <span className="text-xs font-semibold tracking-wider">Loading organization settings...</span>
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="max-w-lg mx-auto mt-12 p-6 rounded-xl border border-red-100 bg-red-50 text-center">
        <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-3" />
        <p className="text-sm text-red-700 font-medium">{error ?? "Unable to load organization settings."}</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={loadSettings}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          Organization & Settings
        </h1>
        <p className="text-sm text-muted mt-1">
          Manage workspace profile and team access. Synced with Clerk Organizations and your database.
        </p>
        <div className="mt-2 flex items-center gap-2">
          <Badge variant={roleBadgeVariant(settings.currentUserRole)}>{settings.currentUserRole}</Badge>
          <span className="text-[10px] text-muted">Your role in this workspace</span>
        </div>
      </div>

      {actionError && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {actionError}
        </div>
      )}

      {successMsg && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 px-4 py-3 text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {successMsg}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-foreground" />
                Workspace Info
              </CardTitle>
              <CardDescription>Organization profile from Clerk + Prisma.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted uppercase">Organization Name</label>
                  <Input
                    type="text"
                    value={tempOrgName}
                    onChange={(e) => setTempOrgName(e.target.value)}
                    disabled={!settings.permissions.canEditProfile || isPending}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase">Workspace Slug</label>
                  <div className="h-10 px-4 rounded-2xl border border-border bg-[#F4F5F1] flex items-center text-xs text-muted select-none">
                    {settings.slug}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase">Created</label>
                  <div className="h-10 px-4 rounded-2xl border border-border bg-[#F4F5F1] flex items-center text-xs text-muted select-none">
                    {new Date(settings.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {settings.permissions.canEditProfile ? (
                  <Button type="submit" size="sm" className="w-full" disabled={isPending}>
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                  </Button>
                ) : (
                  <p className="text-[10px] text-muted text-center pt-1">
                    Only owners and admins can edit workspace profile.
                  </p>
                )}
              </form>
            </CardContent>
          </Card>

          <Card className="bg-primary/15 border-primary/30">
            <CardContent className="p-4 flex gap-3 text-xs leading-normal">
              <ShieldAlert className="h-5 w-5 text-foreground shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-foreground">RBAC & Audit Safety</h4>
                <p className="text-muted mt-1 text-[11px]">
                  Role changes and removals are enforced server-side. The last owner cannot be removed or demoted.
                  Admins manage members only; owners manage all roles.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users2 className="h-4 w-4 text-foreground" />
                  Team Roster
                </CardTitle>
                <CardDescription>
                  {settings.members.length} member{settings.members.length === 1 ? "" : "s"} in this workspace.
                </CardDescription>
              </div>
              {settings.permissions.canInvite && (
                <Button
                  size="sm"
                  onClick={() => {
                    setActionError(null);
                    setModalOpen(true);
                  }}
                  className="flex items-center gap-1 shrink-0"
                  disabled={isPending}
                >
                  <Plus className="h-4 w-4" /> Invite Member
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse table-premium">
                  <thead>
                    <tr className="text-[10px] font-bold text-muted uppercase tracking-wider">
                      <th className="px-6 py-3">Member</th>
                      <th className="px-6 py-3">Role</th>
                      <th className="px-6 py-3">Date Joined</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settings.members.map((member) => (
                      <tr key={member.id} className="text-xs text-foreground">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/40 border border-border text-foreground font-bold flex items-center justify-center shrink-0">
                              {member.name
                                .split(" ")
                                .map((w) => w[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-foreground">{member.name}</p>
                              <span className="text-[10px] text-muted flex items-center gap-1 mt-0.5">
                                <Mail className="h-3 w-3" /> {member.email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {member.canChangeRole && member.allowedRoles.length > 0 ? (
                            <select
                              value={member.role}
                              disabled={isPending}
                              onChange={(e) =>
                                handleRoleChange(member, e.target.value as MembershipRole)
                              }
                              className="h-8 rounded-xl border border-border bg-surface px-2 text-[10px] font-semibold text-foreground input-focus"
                            >
                              {member.allowedRoles.map((role) => (
                                <option key={role} value={role}>
                                  {role}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <Badge variant={roleBadgeVariant(member.role)}>{member.role}</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-muted">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" /> {member.joinedAt}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {member.canRemove ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-300 hover:bg-red-50"
                              disabled={isPending}
                              onClick={() => {
                                setActionError(null);
                                setRemoveTarget(member);
                              }}
                              aria-label={`Remove ${member.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : (
                            <span className="text-[10px] text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Invite Team Member"
        description="Clerk will email an invitation. Role syncs to Prisma when they accept."
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted uppercase">Email Address *</label>
            <Input
              type="email"
              placeholder="teammate@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted uppercase">Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as "ADMIN" | "MEMBER")}
              disabled={isPending}
              className="flex h-10 w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground input-focus"
            >
              <option value="MEMBER">MEMBER — Sales rep access</option>
              <option value="ADMIN">ADMIN — Team & settings management</option>
            </select>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Invitation"}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        title="Remove Team Member"
        description={
          removeTarget
            ? `Remove ${removeTarget.name} from this workspace? They will lose access immediately.`
            : undefined
        }
      >
        <div className="flex gap-3 justify-end pt-4">
          <Button type="button" variant="secondary" onClick={() => setRemoveTarget(null)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-red-600 hover:bg-red-500"
            onClick={handleRemoveMember}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remove Member"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
