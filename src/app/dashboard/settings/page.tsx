"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import {
  User as UserIcon,
  Phone,
  FileText,
  Tag as TagIcon,
  Settings,
  Plus,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  Key,
  ShieldAlert,
  Edit2,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Laptop,
  ChevronRight,
  Palette,
  Webhook,
  LayoutGrid,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import {
  getUserProfileAction,
  updateUserProfileAction,
  updateUserPasswordAction,
  revokeAllSessionsAction,
  getWhatsAppConfigAction,
  saveWhatsAppConfigAction,
  getTemplatesAction,
  createTemplateAction,
  deleteTemplateAction,
  getTagsAction,
  createTagAction,
  updateTagAction,
  deleteTagAction,
} from "@/actions/settings";

type TabType = "profile" | "whatsapp" | "templates" | "tags" | "appearance";

const NAV_ITEMS: { id: TabType; label: string; description: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "profile",    label: "Profile",        description: "Your name, password & sessions", icon: UserIcon },
  { id: "whatsapp",  label: "WhatsApp Config", description: "Meta API credentials & webhook", icon: Phone },
  { id: "templates", label: "Templates",       description: "Message template library",        icon: FileText },
  { id: "tags",      label: "Tags",            description: "Contact segmentation labels",     icon: TagIcon },
  { id: "appearance",label: "Appearance",      description: "Theme & sidebar preferences",    icon: Palette },
];

const presetColors = [
  { name: "Blue",    hex: "#3B82F6" },
  { name: "Emerald", hex: "#10B981" },
  { name: "Lime",    hex: "#84CC16" },
  { name: "Amber",   hex: "#F59E0B" },
  { name: "Coral",   hex: "#F97316" },
  { name: "Rose",    hex: "#EF4444" },
  { name: "Purple",  hex: "#8B5CF6" },
  { name: "Pink",    hex: "#EC4899" },
  { name: "Slate",   hex: "#64748B" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [isPending, startTransition] = useTransition();

  /* ── Profile ── */
  const [profileLoading, setProfileLoading] = useState(true);
  const [profile, setProfile] = useState<{
    id: string; clerkId: string; email: string;
    firstName: string; lastName: string; role: string; createdAt: string;
  } | null>(null);
  const [profileForm, setProfileForm] = useState({ firstName: "", lastName: "" });
  const [passwordForm, setPasswordForm] = useState({ password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);

  /* ── WhatsApp ── */
  const [waLoading, setWaLoading] = useState(true);
  const [waConfig, setWaConfig] = useState<{
    phoneNumberId: string; wabaId: string; accessToken: string;
    verifyToken: string; status: string; connectedAt: string | null;
  } | null>(null);
  const [waForm, setWaForm] = useState({ phoneNumberId: "", wabaId: "", accessToken: "", verifyToken: "", pin: "" });
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const webhookUrl = typeof window !== "undefined" ? `${window.location.origin}/api/whatsapp/webhook` : "/api/whatsapp/webhook";

  /* ── Templates ── */
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  const [createTemplateOpen, setCreateTemplateOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: "", category: "MARKETING", language: "en_US",
    headerType: "NONE", headerContent: "", bodyText: "", footerText: ""
  });
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);

  /* ── Tags ── */
  const [tagsLoading, setTagsLoading] = useState(true);
  const [tags, setTags] = useState<any[]>([]);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<any | null>(null);
  const [tagForm, setTagForm] = useState({ name: "", color: "#3B82F6" });
  const [deleteTagId, setDeleteTagId] = useState<string | null>(null);

  /* ── Appearance ── */
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  const [sidebarLayout, setSidebarLayout] = useState<"full" | "compact">("full");

  /* ── Loaders ── */
  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    const res = await getUserProfileAction();
    if (res.success && res.data) {
      setProfile(res.data);
      setProfileForm({ firstName: res.data.firstName, lastName: res.data.lastName });
    } else toast.error(res.error || "Failed to load profile.");
    setProfileLoading(false);
  }, []);

  const loadWhatsAppConfig = useCallback(async () => {
    setWaLoading(true);
    const res = await getWhatsAppConfigAction();
    if (res.success) {
      if (res.data) {
        setWaConfig(res.data);
        setWaForm({ phoneNumberId: res.data.phoneNumberId, wabaId: res.data.wabaId, accessToken: res.data.accessToken, verifyToken: res.data.verifyToken, pin: "" });
      }
    } else toast.error(res.error || "Failed to load WhatsApp config.");
    setWaLoading(false);
  }, []);

  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    const res = await getTemplatesAction();
    if (res.success && res.data) setTemplates(res.data);
    else toast.error(res.error || "Failed to load templates.");
    setTemplatesLoading(false);
  }, []);

  const loadTags = useCallback(async () => {
    setTagsLoading(true);
    const res = await getTagsAction();
    if (res.success && res.data) setTags(res.data);
    else toast.error(res.error || "Failed to load tags.");
    setTagsLoading(false);
  }, []);

  useEffect(() => {
    if (activeTab === "profile")    loadProfile();
    if (activeTab === "whatsapp")   loadWhatsAppConfig();
    if (activeTab === "templates")  loadTemplates();
    if (activeTab === "tags")       loadTags();
  }, [activeTab, loadProfile, loadWhatsAppConfig, loadTemplates, loadTags]);

  useEffect(() => {
    const t = localStorage.getItem("aura-theme") as any;
    if (t) setTheme(t);
    const s = localStorage.getItem("aura-sidebar-layout") as any;
    if (s) setSidebarLayout(s);
  }, []);

  /* ── Handlers ── */
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.firstName.trim()) { toast.error("First name is required."); return; }
    startTransition(async () => {
      const res = await updateUserProfileAction(profileForm);
      if (res.success) { toast.success("Profile updated!"); loadProfile(); }
      else toast.error(res.error || "Failed to update profile.");
    });
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    if (passwordForm.password !== passwordForm.confirmPassword) { toast.error("Passwords do not match."); return; }
    startTransition(async () => {
      const res = await updateUserPasswordAction({ password: passwordForm.password });
      if (res.success) { toast.success("Password updated!"); setPasswordForm({ password: "", confirmPassword: "" }); }
      else toast.error(res.error || "Failed to update password.");
    });
  };

  const handleRevokeSessions = () => {
    if (!confirm("Sign out of ALL devices including this one?")) return;
    startTransition(async () => {
      const res = await revokeAllSessionsAction();
      if (res.success) { toast.success("All sessions revoked."); window.location.reload(); }
      else toast.error(res.error || "Failed to revoke sessions.");
    });
  };

  const handleSaveWhatsAppConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waForm.phoneNumberId.trim() || !waForm.wabaId.trim() || !waForm.accessToken.trim() || !waForm.verifyToken.trim()) {
      toast.error("All fields except PIN are required."); return;
    }
    startTransition(async () => {
      const res = await saveWhatsAppConfigAction(waForm);
      if (res.success) { toast.success("WhatsApp configuration saved!"); loadWhatsAppConfig(); }
      else toast.error(res.error || "Failed to save configuration.");
    });
  };

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateForm.name.trim() || !templateForm.bodyText.trim()) { toast.error("Name and Body are required."); return; }
    const cleanName = templateForm.name.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    startTransition(async () => {
      const res = await createTemplateAction({
        name: cleanName, category: templateForm.category, language: templateForm.language,
        headerType: templateForm.headerType !== "NONE" ? templateForm.headerType : undefined,
        headerContent: templateForm.headerType !== "NONE" ? templateForm.headerContent : undefined,
        bodyText: templateForm.bodyText, footerText: templateForm.footerText || undefined, status: "Approved",
      });
      if (res.success) {
        toast.success("Template created!");
        setCreateTemplateOpen(false);
        setTemplateForm({ name: "", category: "MARKETING", language: "en_US", headerType: "NONE", headerContent: "", bodyText: "", footerText: "" });
        loadTemplates();
      } else toast.error(res.error || "Failed to create template.");
    });
  };

  const handleDeleteTemplate = () => {
    if (!deleteTemplateId) return;
    startTransition(async () => {
      const res = await deleteTemplateAction(deleteTemplateId);
      if (res.success) { toast.success("Template deleted."); setDeleteTemplateId(null); loadTemplates(); }
      else toast.error(res.error || "Failed to delete template.");
    });
  };

  const handleSaveTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagForm.name.trim()) { toast.error("Tag name is required."); return; }
    startTransition(async () => {
      const res = editingTag ? await updateTagAction(editingTag.id, tagForm) : await createTagAction(tagForm);
      if (res.success) {
        toast.success(editingTag ? "Tag updated!" : "Tag created!");
        setTagModalOpen(false); setEditingTag(null); setTagForm({ name: "", color: "#3B82F6" }); loadTags();
      } else toast.error(res.error || "Failed to save tag.");
    });
  };

  const handleDeleteTag = () => {
    if (!deleteTagId) return;
    startTransition(async () => {
      const res = await deleteTagAction(deleteTagId);
      if (res.success) { toast.success("Tag deleted."); setDeleteTagId(null); loadTags(); }
      else toast.error(res.error || "Failed to delete tag.");
    });
  };

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    toast.success("Webhook URL copied!");
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const updateTheme = (t: "light" | "dark" | "system") => {
    setTheme(t); localStorage.setItem("aura-theme", t); toast.success(`Theme set to ${t}`);
  };
  const updateSidebar = (s: "full" | "compact") => {
    setSidebarLayout(s); localStorage.setItem("aura-sidebar-layout", s); toast.success(`Sidebar layout set to ${s}`);
  };

  const getInitials = () => {
    if (!profile) return "U";
    return `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`.toUpperCase() || "U";
  };

  const activeNav = NAV_ITEMS.find((n) => n.id === activeTab)!;

  return (
    <div className="flex h-full min-h-[calc(100vh-8rem)] rounded-3xl border border-border bg-white shadow-[0_4px_32px_rgba(17,17,17,0.04)] overflow-hidden">

      {/* ── Left Settings Navigation Panel ── */}
      <aside className="w-64 shrink-0 border-r border-border bg-[#FAFBFA] flex flex-col">
        {/* Panel header */}
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-foreground flex items-center justify-center shrink-0">
              <Settings className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground leading-tight">Settings</p>
              <p className="text-[10px] text-muted font-medium">Workspace preferences</p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-all duration-150 group ${
                  active
                    ? "bg-foreground text-white shadow-sm"
                    : "text-muted hover:bg-[rgba(17,17,17,0.05)] hover:text-foreground"
                }`}
              >
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  active ? "bg-white/15" : "bg-[rgba(17,17,17,0.06)] group-hover:bg-[rgba(17,17,17,0.09)]"
                }`}>
                  <Icon className={`h-4 w-4 ${active ? "text-white" : "text-muted group-hover:text-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold leading-tight truncate ${active ? "text-white" : "text-foreground"}`}>
                    {item.label}
                  </p>
                  <p className={`text-[10px] truncate mt-0.5 ${active ? "text-white/65" : "text-muted"}`}>
                    {item.description}
                  </p>
                </div>
                {active && <ChevronRight className="h-3.5 w-3.5 text-white/60 shrink-0" />}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <p className="text-[10px] text-muted text-center font-medium">AuraCRM · Workspace Settings</p>
        </div>
      </aside>

      {/* ── Right Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Content Header */}
        <div className="px-7 py-5 border-b border-border bg-white flex items-center gap-3 shrink-0">
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">{activeNav.label}</h1>
            <p className="text-[11px] text-muted font-medium mt-0.5">{activeNav.description}</p>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >

              {/* ═══════════════════════════════════ */}
              {/* 1. PROFILE                          */}
              {/* ═══════════════════════════════════ */}
              {activeTab === "profile" && (
                <div className="space-y-6">
                  {profileLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted">
                      <Loader2 className="h-7 w-7 animate-spin text-foreground/30" />
                      <span className="text-xs font-medium mt-3">Loading profile…</span>
                    </div>
                  ) : (
                    <div className="grid lg:grid-cols-[260px_1fr] gap-6 items-start">

                      {/* Avatar card */}
                      <div className="space-y-4">
                        <div className="rounded-3xl border border-border bg-[#FAFBFA] p-6 flex flex-col items-center text-center space-y-4">
                          <div className="h-20 w-20 rounded-2xl bg-foreground flex items-center justify-center font-black text-2xl text-white shadow-lg">
                            {getInitials()}
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-sm">{profile?.firstName} {profile?.lastName}</p>
                            <p className="text-[11px] text-muted mt-0.5">{profile?.email}</p>
                          </div>
                          <div className="w-full border-t border-border pt-4 space-y-2.5 text-left">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-muted uppercase tracking-wide">Role</span>
                              <Badge variant="neutral" className="text-[9px] font-bold uppercase tracking-wider">{profile?.role}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-muted uppercase tracking-wide">Joined</span>
                              <span className="text-[11px] font-semibold text-foreground">
                                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" }) : "—"}
                              </span>
                            </div>
                            <div className="pt-1 space-y-1">
                              <span className="text-[10px] font-bold text-muted uppercase tracking-wide">User ID</span>
                              <p className="text-[9px] font-mono text-muted/70 bg-white border border-border/60 rounded-xl p-2 break-all select-all">{profile?.id}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Forms */}
                      <div className="space-y-5">

                        {/* Personal Information */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                              <UserIcon className="h-4 w-4" /> Personal Information
                            </CardTitle>
                            <CardDescription className="text-xs">
                              Your name appears in the header, sidebar, and anywhere your teammates see you.
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-muted uppercase">First Name *</label>
                                  <Input value={profileForm.firstName} onChange={(e) => setProfileForm((f) => ({ ...f, firstName: e.target.value }))} required disabled={isPending} />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-muted uppercase">Last Name</label>
                                  <Input value={profileForm.lastName} onChange={(e) => setProfileForm((f) => ({ ...f, lastName: e.target.value }))} disabled={isPending} />
                                </div>
                              </div>
                              <div className="flex justify-end">
                                <Button type="submit" disabled={isPending} size="sm">
                                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />}
                                  Save Profile
                                </Button>
                              </div>
                            </form>
                          </CardContent>
                        </Card>

                        {/* Password */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                              <Lock className="h-4 w-4" /> Change Password
                            </CardTitle>
                            <CardDescription className="text-xs">
                              Use at least 8 characters. You will stay signed in on this device.
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <form onSubmit={handleUpdatePassword} className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-muted uppercase">New Password</label>
                                  <div className="relative">
                                    <Input type={showPassword ? "text" : "password"} placeholder="••••••••" value={passwordForm.password} onChange={(e) => setPasswordForm((f) => ({ ...f, password: e.target.value }))} required disabled={isPending} className="pr-10" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
                                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                  </div>
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-muted uppercase">Confirm Password</label>
                                  <Input type={showPassword ? "text" : "password"} placeholder="••••••••" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))} required disabled={isPending} />
                                </div>
                              </div>
                              <div className="flex justify-end">
                                <Button type="submit" disabled={isPending} size="sm" variant="outline">
                                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />}
                                  Change Password
                                </Button>
                              </div>
                            </form>
                          </CardContent>
                        </Card>

                        {/* Sessions */}
                        <div className="rounded-2xl border border-red-100 bg-red-50/30 p-5 flex items-center justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="h-9 w-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                              <ShieldAlert className="h-4 w-4 text-red-600" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-red-700">Active Sessions</p>
                              <p className="text-[11px] text-red-600/80 mt-0.5">Sign out of every device — including this one.</p>
                            </div>
                          </div>
                          <Button type="button" onClick={handleRevokeSessions} disabled={isPending} className="shrink-0 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl h-auto">
                            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                            Sign out all
                          </Button>
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ═══════════════════════════════════ */}
              {/* 2. WHATSAPP CONFIG                  */}
              {/* ═══════════════════════════════════ */}
              {activeTab === "whatsapp" && (
                <div className="space-y-6">
                  {waLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted">
                      <Loader2 className="h-7 w-7 animate-spin text-foreground/30" />
                      <span className="text-xs font-medium mt-3">Loading WhatsApp credentials…</span>
                    </div>
                  ) : (
                    <div className="grid lg:grid-cols-[1fr_280px] gap-6 items-start">

                      {/* API Credentials form */}
                      <div className="space-y-5">
                        <Card>
                          <CardHeader className="flex flex-row items-start justify-between gap-4">
                            <div>
                              <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Phone className="h-4 w-4" /> API Credentials
                              </CardTitle>
                              <CardDescription className="text-xs mt-1">
                                Configure your Meta Business API credentials to connect WhatsApp.
                              </CardDescription>
                            </div>
                            <Badge variant={waConfig?.status === "connected" ? "success" : "neutral"} className="uppercase text-[9px] font-bold tracking-wider shrink-0 mt-0.5">
                              {waConfig?.status === "connected" ? "● Connected" : "○ Not Connected"}
                            </Badge>
                          </CardHeader>
                          <CardContent>
                            <form onSubmit={handleSaveWhatsAppConfig} className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-muted uppercase">Phone Number ID *</label>
                                  <Input placeholder="e.g. 100234567890123" value={waForm.phoneNumberId} onChange={(e) => setWaForm((f) => ({ ...f, phoneNumberId: e.target.value }))} required disabled={isPending} />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-muted uppercase">WABA ID *</label>
                                  <Input placeholder="e.g. 100234567890456" value={waForm.wabaId} onChange={(e) => setWaForm((f) => ({ ...f, wabaId: e.target.value }))} required disabled={isPending} />
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-muted uppercase">Access Token *</label>
                                <div className="relative">
                                  <Input type={showAccessToken ? "text" : "password"} placeholder="Enter your Meta Access Token" value={waForm.accessToken} onChange={(e) => setWaForm((f) => ({ ...f, accessToken: e.target.value }))} required disabled={isPending} className="pr-12" />
                                  <button type="button" onClick={() => setShowAccessToken(!showAccessToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
                                    {showAccessToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </button>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-muted uppercase">Webhook Verify Token *</label>
                                  <Input placeholder="Your custom verify token" value={waForm.verifyToken} onChange={(e) => setWaForm((f) => ({ ...f, verifyToken: e.target.value }))} required disabled={isPending} />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-muted uppercase">6-digit PIN (Optional)</label>
                                  <Input type="password" maxLength={6} placeholder="123456" value={waForm.pin} onChange={(e) => setWaForm((f) => ({ ...f, pin: e.target.value.replace(/\D/g, "") }))} disabled={isPending} />
                                </div>
                              </div>
                              <p className="text-[10px] text-muted border-l-2 border-border pl-3 leading-relaxed">
                                <strong>PIN:</strong> Required the first time you connect a number. Set it in Meta Business Manager → WhatsApp → Phone Numbers → Two-step verification.
                              </p>
                              <div className="flex justify-end">
                                <Button type="submit" disabled={isPending}>
                                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />}
                                  {waConfig ? "Save Configuration" : "Connect Account"}
                                </Button>
                              </div>
                            </form>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Right column */}
                      <div className="space-y-5">

                        {/* Webhook URL */}
                        <div className="rounded-2xl border border-border bg-[#FAFBFA] p-5 space-y-3">
                          <div className="flex items-center gap-2">
                            <Webhook className="h-4 w-4 text-muted" />
                            <p className="text-xs font-bold text-foreground">Webhook URL</p>
                          </div>
                          <p className="text-[10px] text-muted">Paste this into your Meta App Dashboard as the callback URL.</p>
                          <div className="flex items-center gap-2 bg-white border border-border rounded-xl p-2.5">
                            <span className="text-[10px] font-mono text-muted truncate flex-1 select-all">{webhookUrl}</span>
                            <button onClick={copyWebhook} className="h-7 w-7 shrink-0 flex items-center justify-center rounded-lg bg-[#F4F5F1] hover:bg-[#ECEEE8] border border-border/60 transition-colors">
                              {copiedWebhook ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-muted" />}
                            </button>
                          </div>
                        </div>

                        {/* Setup steps */}
                        <div className="rounded-2xl border border-border bg-[#FAFBFA] p-5 space-y-4">
                          <p className="text-xs font-bold text-foreground flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted" /> Setup Guide
                          </p>
                          {[
                            { n: 1, title: "Create a Meta App", desc: "Go to developer.facebook.com and create a Business App." },
                            { n: 2, title: "Add WhatsApp Product", desc: "Add the WhatsApp product to your Developer App." },
                            { n: 3, title: "Get API Credentials", desc: "Copy your Phone Number ID, WABA ID, and generate a Permanent Access Token." },
                            { n: 4, title: "Configure Webhooks", desc: "Paste the Webhook URL above and subscribe to the \"messages\" field." },
                          ].map((step) => (
                            <div key={step.n} className="flex gap-3">
                              <div className="h-6 w-6 rounded-full bg-foreground flex items-center justify-center font-bold text-white text-[10px] shrink-0 mt-0.5">{step.n}</div>
                              <div>
                                <p className="text-[11px] font-bold text-foreground">{step.title}</p>
                                <p className="text-[10px] text-muted mt-0.5 leading-relaxed">{step.desc}</p>
                              </div>
                            </div>
                          ))}
                          <div className="pt-2 border-t border-border">
                            <a href="https://developers.facebook.com/docs/whatsapp/cloud-api" target="_blank" rel="noreferrer" className="text-[11px] font-bold text-foreground hover:underline flex items-center gap-1">
                              Meta API Docs <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ═══════════════════════════════════ */}
              {/* 3. TEMPLATES                        */}
              {/* ═══════════════════════════════════ */}
              {activeTab === "templates" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-foreground">WhatsApp Approved Templates</h2>
                      <p className="text-[11px] text-muted mt-0.5">Message templates used in broadcasts and automations.</p>
                    </div>
                    <Button size="sm" onClick={() => setCreateTemplateOpen(true)} className="flex items-center gap-1.5">
                      <Plus className="h-4 w-4" /> New Template
                    </Button>
                  </div>

                  {templatesLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted">
                      <Loader2 className="h-7 w-7 animate-spin text-foreground/30" />
                      <span className="text-xs font-medium mt-3">Loading templates…</span>
                    </div>
                  ) : templates.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-[#FAFBFA] py-16 flex flex-col items-center gap-3 text-center">
                      <div className="h-12 w-12 rounded-2xl bg-[rgba(17,17,17,0.06)] flex items-center justify-center">
                        <FileText className="h-6 w-6 text-muted/50" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">No templates yet</p>
                        <p className="text-[11px] text-muted mt-1 max-w-xs">Create templates to send rich messages in broadcasts and automations.</p>
                      </div>
                      <Button size="sm" onClick={() => setCreateTemplateOpen(true)} className="mt-1">
                        <Plus className="h-3.5 w-3.5 mr-1.5" /> Create first template
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-border overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-[#FAFBFA] border-b border-border text-muted font-bold uppercase text-[10px] tracking-wider">
                            <th className="px-4 py-3">Template Name</th>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3">Language</th>
                            <th className="px-4 py-3">Body Preview</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {templates.map((tmpl) => (
                            <tr key={tmpl.id} className="hover:bg-[#FAFBFA]/60 transition-colors">
                              <td className="px-4 py-3 font-bold font-mono text-[11px] text-foreground">{tmpl.name}</td>
                              <td className="px-4 py-3"><Badge variant="neutral" className="text-[9px] font-bold">{tmpl.category}</Badge></td>
                              <td className="px-4 py-3 text-muted font-semibold">{tmpl.language}</td>
                              <td className="px-4 py-3 max-w-[200px] truncate text-muted/90">{tmpl.bodyText}</td>
                              <td className="px-4 py-3"><Badge variant="success" className="text-[9px] font-bold uppercase">{tmpl.status}</Badge></td>
                              <td className="px-4 py-3 text-right">
                                <Button variant="ghost" size="icon" onClick={() => setDeleteTemplateId(tmpl.id)} className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Create Template Drawer */}
                  <Drawer open={createTemplateOpen} onClose={() => setCreateTemplateOpen(false)} title="Create WhatsApp Template" description="Register a new message template for broadcasts and automations.">
                    <form onSubmit={handleCreateTemplate} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted uppercase">Template Name *</label>
                          <Input placeholder="e.g. welcome_user" value={templateForm.name} onChange={(e) => setTemplateForm((f) => ({ ...f, name: e.target.value }))} required />
                          <p className="text-[9px] text-muted">Lowercase and underscores only.</p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted uppercase">Category</label>
                          <select value={templateForm.category} onChange={(e) => setTemplateForm((f) => ({ ...f, category: e.target.value }))} className="flex h-10 w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground input-focus">
                            <option value="MARKETING">MARKETING</option>
                            <option value="UTILITY">UTILITY</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted uppercase">Language</label>
                          <Input value={templateForm.language} onChange={(e) => setTemplateForm((f) => ({ ...f, language: e.target.value }))} placeholder="e.g. en_US" required />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted uppercase">Header Type</label>
                          <select value={templateForm.headerType} onChange={(e) => setTemplateForm((f) => ({ ...f, headerType: e.target.value }))} className="flex h-10 w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground input-focus">
                            <option value="NONE">None</option>
                            <option value="TEXT">Text</option>
                          </select>
                        </div>
                      </div>
                      {templateForm.headerType === "TEXT" && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted uppercase">Header Content</label>
                          <Input placeholder="e.g. Welcome to AuraCRM!" value={templateForm.headerContent} onChange={(e) => setTemplateForm((f) => ({ ...f, headerContent: e.target.value }))} />
                        </div>
                      )}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted uppercase">Body Text *</label>
                        <Textarea placeholder={"e.g. Hello {{1}}, welcome to our platform!"} value={templateForm.bodyText} onChange={(e) => setTemplateForm((f) => ({ ...f, bodyText: e.target.value }))} required rows={4} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted uppercase">Footer Text</label>
                        <Input placeholder="e.g. Reply STOP to opt out" value={templateForm.footerText} onChange={(e) => setTemplateForm((f) => ({ ...f, footerText: e.target.value }))} />
                      </div>
                      <div className="flex gap-3 justify-end pt-3 border-t border-border">
                        <Button type="button" variant="secondary" onClick={() => setCreateTemplateOpen(false)} disabled={isPending}>Cancel</Button>
                        <Button type="submit" disabled={isPending}>
                          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />}
                          Register Template
                        </Button>
                      </div>
                    </form>
                  </Drawer>

                  {/* Delete Template Dialog */}
                  <Dialog open={!!deleteTemplateId} onClose={() => setDeleteTemplateId(null)} title="Delete Template">
                    <div className="space-y-4">
                      <p className="text-xs text-muted">Are you sure you want to delete this template? Any automations referencing it will fail.</p>
                      <div className="flex gap-3 justify-end">
                        <Button type="button" variant="secondary" onClick={() => setDeleteTemplateId(null)} disabled={isPending}>Cancel</Button>
                        <Button type="button" onClick={handleDeleteTemplate} disabled={isPending} className="bg-red-600 hover:bg-red-700 text-white">
                          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />}
                          Delete Template
                        </Button>
                      </div>
                    </div>
                  </Dialog>
                </div>
              )}

              {/* ═══════════════════════════════════ */}
              {/* 4. TAGS                             */}
              {/* ═══════════════════════════════════ */}
              {activeTab === "tags" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-foreground">Contact Tags</h2>
                      <p className="text-[11px] text-muted mt-0.5">Segment contacts with color-coded labels for filtering and targeting.</p>
                    </div>
                    <Button size="sm" onClick={() => { setEditingTag(null); setTagForm({ name: "", color: "#3B82F6" }); setTagModalOpen(true); }} className="flex items-center gap-1.5">
                      <Plus className="h-4 w-4" /> New Tag
                    </Button>
                  </div>

                  {tagsLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted">
                      <Loader2 className="h-7 w-7 animate-spin text-foreground/30" />
                      <span className="text-xs font-medium mt-3">Loading tags…</span>
                    </div>
                  ) : tags.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-[#FAFBFA] py-16 flex flex-col items-center gap-3 text-center">
                      <div className="h-12 w-12 rounded-2xl bg-[rgba(17,17,17,0.06)] flex items-center justify-center">
                        <TagIcon className="h-6 w-6 text-muted/50" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">No tags configured</p>
                        <p className="text-[11px] text-muted mt-1">Create segments like "VIP", "Lead", or "Cold" to filter contacts.</p>
                      </div>
                      <Button size="sm" onClick={() => { setEditingTag(null); setTagForm({ name: "", color: "#3B82F6" }); setTagModalOpen(true); }} className="mt-1">
                        <Plus className="h-3.5 w-3.5 mr-1.5" /> Create first tag
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                      {tags.map((tag) => (
                        <div key={tag.id} className="group flex items-center justify-between gap-3 p-4 rounded-2xl border border-border bg-white hover:bg-[#FAFBFA] hover:border-border/80 transition-all">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-4 w-4 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: tag.color }} />
                            <span className="text-sm font-bold text-foreground truncate">{tag.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingTag(tag); setTagForm({ name: tag.name, color: tag.color }); setTagModalOpen(true); }} className="h-7 w-7 rounded-lg border border-border/50 hover:bg-white flex items-center justify-center text-muted hover:text-foreground transition-colors">
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => setDeleteTagId(tag.id)} className="h-7 w-7 rounded-lg border border-border/50 hover:bg-red-50 flex items-center justify-center text-muted hover:text-red-600 transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tag Drawer */}
                  <Drawer open={tagModalOpen} onClose={() => setTagModalOpen(false)} title={editingTag ? "Edit Tag" : "Create Tag"} description="Define a color-coded label to segment your contacts.">
                    <form onSubmit={handleSaveTag} className="space-y-5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted uppercase">Tag Name *</label>
                        <Input placeholder="e.g. VIP Customer" value={tagForm.name} onChange={(e) => setTagForm((f) => ({ ...f, name: e.target.value }))} required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted uppercase">Color</label>
                        <div className="grid grid-cols-5 gap-2">
                          {presetColors.map((color) => (
                            <button key={color.hex} type="button" onClick={() => setTagForm((f) => ({ ...f, color: color.hex }))}
                              className={`h-9 rounded-xl border-2 transition-all flex items-center justify-center ${tagForm.color === color.hex ? "border-foreground scale-105 shadow-md" : "border-transparent hover:scale-105"}`}
                              style={{ backgroundColor: color.hex }} title={color.name}>
                              {tagForm.color === color.hex && <Check className="h-4 w-4 text-white drop-shadow" />}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Input type="color" value={tagForm.color} onChange={(e) => setTagForm((f) => ({ ...f, color: e.target.value }))} className="h-9 w-12 p-0.5 rounded-xl border border-border shrink-0" />
                          <Input type="text" maxLength={7} placeholder="#HEXCOLOR" value={tagForm.color} onChange={(e) => setTagForm((f) => ({ ...f, color: e.target.value }))} className="text-xs uppercase font-mono" />
                        </div>
                      </div>
                      <div className="flex gap-3 justify-end pt-3 border-t border-border">
                        <Button type="button" variant="secondary" onClick={() => setTagModalOpen(false)} disabled={isPending}>Cancel</Button>
                        <Button type="submit" disabled={isPending}>
                          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />}
                          {editingTag ? "Save Changes" : "Create Tag"}
                        </Button>
                      </div>
                    </form>
                  </Drawer>

                  {/* Delete Tag Dialog */}
                  <Dialog open={!!deleteTagId} onClose={() => setDeleteTagId(null)} title="Delete Tag">
                    <div className="space-y-4">
                      <p className="text-xs text-muted">Delete this tag? Contacts will be automatically untagged. This action is permanent.</p>
                      <div className="flex gap-3 justify-end">
                        <Button type="button" variant="secondary" onClick={() => setDeleteTagId(null)} disabled={isPending}>Cancel</Button>
                        <Button type="button" onClick={handleDeleteTag} disabled={isPending} className="bg-red-600 hover:bg-red-700 text-white">
                          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />}
                          Delete Tag
                        </Button>
                      </div>
                    </div>
                  </Dialog>
                </div>
              )}

              {/* ═══════════════════════════════════ */}
              {/* 5. APPEARANCE                       */}
              {/* ═══════════════════════════════════ */}
              {activeTab === "appearance" && (
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <h2 className="text-sm font-bold text-foreground">Theme & Layout</h2>
                    <p className="text-[11px] text-muted mt-0.5">Customize the look and feel of AuraCRM in this browser.</p>
                  </div>

                  {/* Theme */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Sun className="h-4 w-4" /> Color Theme
                      </CardTitle>
                      <CardDescription className="text-xs">Choose between Light, Dark, or follow your OS setting.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-3">
                        {(["light", "dark", "system"] as const).map((t) => {
                          const icons = { light: Sun, dark: Moon, system: Laptop };
                          const labels = { light: "Light", dark: "Dark", system: "System" };
                          const Icon = icons[t];
                          return (
                            <button key={t} onClick={() => updateTheme(t)}
                              className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${
                                theme === t ? "border-foreground bg-foreground text-white shadow-lg" : "border-border hover:border-foreground/30 text-muted hover:text-foreground"
                              }`}>
                              <Icon className="h-5 w-5" />
                              <span className="text-xs font-bold">{labels[t]}</span>
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Sidebar layout */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <LayoutGrid className="h-4 w-4" /> Sidebar Layout
                      </CardTitle>
                      <CardDescription className="text-xs">Toggle between full labels or compact icon-only sidebar.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        {(["full", "compact"] as const).map((s) => (
                          <button key={s} onClick={() => updateSidebar(s)}
                            className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${
                              sidebarLayout === s ? "border-foreground bg-foreground text-white shadow-lg" : "border-border hover:border-foreground/30 text-muted hover:text-foreground"
                            }`}>
                            <div className={`w-14 h-8 rounded-lg border flex overflow-hidden ${sidebarLayout === s ? "border-white/30" : "border-border"}`}>
                              <div className={`${s === "full" ? "w-5" : "w-2.5"} h-full ${sidebarLayout === s ? "bg-white/30" : "bg-foreground/10"} border-r ${sidebarLayout === s ? "border-white/20" : "border-border"}`} />
                              <div className="flex-1" />
                            </div>
                            <span className="text-xs font-bold capitalize">{s} Sidebar</span>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
