"use client";

import React, { useState, useEffect, useTransition, useCallback } from "react";
import {
  Search,
  Plus,
  Users2,
  Phone,
  Mail,
  Building2,
  Calendar,
  ChevronRight,
  User,
  Info,
  Trash2,
  Edit3,
  AlertTriangle,
  Loader2,
  Coins,
  MessageSquare,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  getLeadsAction,
  createLeadAction,
  updateLeadAction,
  updateLeadStatusAction,
  deleteLeadAction
} from "@/actions/leads";
import { leadSchema, LeadInput, LeadStatus } from "@/lib/validations/leads";

interface LeadRecord {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string | null;
  status: LeadStatus;
  notes: string | null;
  value: number;
  createdAt: string;
  updatedAt?: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search & Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modals & Detail Sidebar state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);

  // Form State & Validation Errors
  const [formValues, setFormValues] = useState<Partial<LeadInput>>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    source: "",
    status: "NEW",
    notes: "",
    value: 0
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  // Status mapping to color variants
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "NEW":
        return "neutral";
      case "CONTACTED":
        return "info";
      case "QUALIFIED":
        return "warning";
      case "PROPOSAL":
        return "warning";
      case "WON":
        return "success";
      case "LOST":
        return "danger";
      default:
        return "neutral";
    }
  };

  // Helper to serialize status label
  const formatStatus = (status: string) => {
    if (!status) return "";
    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  // Load leads from secure Server Action
  const loadLeads = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getLeadsAction();
    if (result.success && result.data) {
      const freshData = result.data as LeadRecord[];
      setLeads(freshData);
      // Keep selected lead reference updated with fresh db state if it exists
      setSelectedLead((prev) => {
        if (!prev) return null;
        return freshData.find((l) => l.id === prev.id) || null;
      });
    } else {
      setError(result.error || "Unable to retrieve lead records.");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLeads();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadLeads]);

  // Filtered Leads (Client-side for sub-millisecond search & instant filter clicks)
  const filteredLeads = leads.filter((lead) => {
    const fullName = `${lead.firstName || ""} ${lead.lastName || ""}`.toLowerCase();
    const company = (lead.company || "").toLowerCase();
    const email = (lead.email || "").toLowerCase();
    const source = (lead.source || "").toLowerCase();
    const query = search.toLowerCase();

    const matchesSearch =
      fullName.includes(query) ||
      company.includes(query) ||
      email.includes(query) ||
      source.includes(query);

    const matchesStatus = statusFilter === "ALL" || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Handle Form Change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value
    }));
    // Clear validation error when typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  // Trigger Add Modal
  const openCreateModal = () => {
    setFormValues({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "",
      source: "Inbound Form",
      status: "NEW",
      notes: "",
      value: 5000
    });
    setValidationErrors({});
    setActionError(null);
    setCreateModalOpen(true);
  };

  // Trigger Edit Modal
  const openEditModal = (lead: LeadRecord) => {
    setFormValues({
      firstName: lead.firstName || "",
      lastName: lead.lastName || "",
      email: lead.email || "",
      phone: lead.phone || "",
      company: lead.company || "",
      source: lead.source || "",
      status: lead.status || "NEW",
      notes: lead.notes || "",
      value: lead.value || 0
    });
    setValidationErrors({});
    setActionError(null);
    setEditModalOpen(true);
  };

  // Handle Create Submit
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setValidationErrors({});

    // Validate client-side first
    const result = leadSchema.safeParse(formValues);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setValidationErrors(fieldErrors);
      return;
    }

    startTransition(async () => {
      const res = await createLeadAction(result.data);
      if (res.success) {
        setCreateModalOpen(false);
        await loadLeads();
      } else {
        setActionError(res.error || "An error occurred while creating the lead.");
      }
    });
  };

  // Handle Edit Submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    setActionError(null);
    setValidationErrors({});

    // Validate client-side
    const result = leadSchema.safeParse(formValues);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setValidationErrors(fieldErrors);
      return;
    }

    startTransition(async () => {
      const res = await updateLeadAction(selectedLead.id, result.data);
      if (res.success) {
        setEditModalOpen(false);
        await loadLeads();
      } else {
        setActionError(res.error || "An error occurred while updating the lead.");
      }
    });
  };

  // Handle Delete
  const handleDeleteLead = (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this lead?")) return;
    
    startTransition(async () => {
      const res = await deleteLeadAction(id);
      if (res.success) {
        setSelectedLead(null);
        await loadLeads();
      } else {
        alert(res.error || "Failed to delete lead.");
      }
    });
  };

  // Handle inline status toggle from sidebar
  const handleStatusChange = (status: LeadStatus) => {
    if (!selectedLead) return;

    startTransition(async () => {
      const res = await updateLeadStatusAction(selectedLead.id, status);
      if (res.success) {
        await loadLeads();
      } else {
        alert(res.error || "Failed to update status.");
      }
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Leads Directory
          </h1>
          <p className="text-sm text-muted mt-1">
            Production-grade multi-tenant client catalog. Secured by Clerk Organization Isolation.
          </p>
        </div>

        <Button size="sm" onClick={openCreateModal} className="flex items-center gap-1.5 ">
          <Plus className="h-4 w-4" /> Add Lead
        </Button>
      </div>

      {/* Database connection error banner */}
      {error && (
        <Card className="border-red-100 bg-red-50">
          <CardContent className="p-4 flex gap-3 text-xs leading-normal items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
            <div className="flex-1">
              <h4 className="font-bold text-red-300">Secure Database Sync Failed</h4>
              <p className="text-muted mt-0.5 text-[11px]">{error}</p>
            </div>
            <Button size="sm" variant="secondary" onClick={loadLeads} className="h-8 text-[11px]">
              Retry Sync
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filter Options Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted" />
          <input
            type="text"
            placeholder="Search leads by name, email, company, or source..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 rounded-full border border-border bg-surface pl-10 pr-4 text-sm text-foreground placeholder:text-muted input-focus"
          />
        </div>

        {/* Filter Badges group */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {["ALL", "NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`h-9 px-4 rounded-lg text-xs font-bold border transition-all cursor-pointer shrink-0 ${
                statusFilter === tab
                  ? "bg-foreground border-transparent text-white"
                  : "bg-[#F4F5F1] border-transparent text-muted hover:text-foreground hover:bg-[rgba(17,17,17,0.04)]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Leads List Table vs Sidebar Details */}
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* List of Leads */}
        <div className={`lg:col-span-2 space-y-3 ${selectedLead ? "hidden lg:block" : ""}`}>
          {isLoading ? (
            // Skeleton Loader States
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse border-border bg-[#F4F5F1]">
                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 w-2/3">
                    <div className="h-9 w-9 rounded-lg bg-[rgba(17,17,17,0.06)] shrink-0" />
                    <div className="space-y-2 w-full">
                      <div className="h-3 bg-[rgba(17,17,17,0.08)] rounded w-1/3" />
                      <div className="h-2 bg-[rgba(17,17,17,0.06)] rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-4 bg-[rgba(17,17,17,0.06)] rounded w-16" />
                </div>
              </Card>
            ))
          ) : filteredLeads.length > 0 ? (
            filteredLeads.map((lead) => (
              <Card
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className={`surface-card surface-card-hover cursor-pointer border transition-all ${
                  selectedLead?.id === lead.id ? "border-foreground/20 bg-primary/10" : "border-border"
                }`}
              >
                <div className="p-5 lg:p-6 flex items-center justify-between gap-5">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="h-11 w-11 rounded-2xl bg-primary/40 border border-border flex items-center justify-center text-foreground shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm lg:text-base font-extrabold text-foreground truncate">
                        {lead.firstName} {lead.lastName}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {lead.company && (
                          <>
                            <span className="text-xs text-muted truncate max-w-[140px] font-medium">{lead.company}</span>
                            <span className="h-1 w-1 rounded-full bg-zinc-400" />
                          </>
                        )}
                        {lead.email && (
                          <>
                            <span className="text-xs text-muted truncate max-w-[180px]">{lead.email}</span>
                            <span className="h-1 w-1 rounded-full bg-zinc-400" />
                          </>
                        )}
                        <span className="text-xs text-muted truncate">{lead.source || "Unknown Source"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm lg:text-base font-black text-foreground">{formatCurrency(lead.value)}</p>
                      <span className="text-[10px] text-muted font-bold uppercase tracking-wider">Valuation</span>
                    </div>
                    <Badge variant={getStatusVariant(lead.status)} className="px-3 py-1 text-[10px] font-bold">
                      {formatStatus(lead.status)}
                    </Badge>
                    <ChevronRight className="h-5 w-5 text-muted" />
                  </div>
                </div>
              </Card>
            ))
          ) : (
            // Gorgeous empty state
            <div className="text-center py-20 rounded-xl bg-[#F4F5F1] border border-border text-muted text-xs">
              <Users2 className="h-12 w-12 text-muted mx-auto mb-3" />
              <h3 className="text-sm font-bold text-foreground mb-1">No Leads Found</h3>
              <p className="text-muted max-w-[280px] mx-auto leading-relaxed">
                Add your first prospect record or change your active status filters above to inspect leads.
              </p>
              <Button size="sm" onClick={openCreateModal} className="mt-4 flex items-center gap-1.5 mx-auto">
                <Plus className="h-3.5 w-3.5" /> Log First Lead
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar Details Pane */}
        <div className={`lg:col-span-1 ${!selectedLead ? "hidden lg:block" : ""}`}>
          {selectedLead ? (
            <Card className="sticky top-22 border-border">
              <CardHeader className="pb-4 border-b border-border space-y-3">
                <div className="lg:hidden">
                  <button
                    type="button"
                    onClick={() => setSelectedLead(null)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-muted hover:text-foreground cursor-pointer"
                  >
                    ← Back to leads list
                  </button>
                </div>
                <div className="flex flex-row items-start justify-between gap-3">
                  <div className="overflow-hidden">
                    <CardTitle className="truncate">
                      {selectedLead.firstName} {selectedLead.lastName}
                    </CardTitle>
                    <CardDescription className="truncate mt-0.5">
                      {selectedLead.company || "No Company Logged"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditModal(selectedLead)}
                      className="h-8 w-8 hover:bg-[rgba(17,17,17,0.04)] border border-border bg-[#F4F5F1]"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteLead(selectedLead.id)}
                      className="h-8 w-8 hover:bg-red-50 group border border-border bg-[#F4F5F1]"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted group-hover:text-red-600 transition-colors" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-4">
                {/* Contact Data */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Contact Specifications</h4>
                  
                  {selectedLead.email ? (
                    <div className="flex items-center gap-2.5 text-sm text-foreground hover:text-foreground transition-colors">
                      <Mail className="h-4 w-4 text-muted shrink-0" />
                      <a href={`mailto:${selectedLead.email}`} className="truncate">
                        {selectedLead.email}
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 text-sm text-muted">
                      <Mail className="h-4 w-4 text-muted shrink-0" />
                      <span className="italic">No email provided</span>
                    </div>
                  )}

                  {selectedLead.phone ? (
                    <div className="flex items-center gap-2.5 text-sm text-foreground hover:text-foreground transition-colors">
                      <Phone className="h-4 w-4 text-muted shrink-0" />
                      <a href={`tel:${selectedLead.phone}`} className="truncate">
                        {selectedLead.phone}
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 text-sm text-muted">
                      <Phone className="h-4 w-4 text-muted shrink-0" />
                      <span className="italic">No phone provided</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2.5 text-xs text-foreground">
                    <Building2 className="h-4 w-4 text-muted shrink-0" />
                    <span>Source: {selectedLead.source || "Direct Lead"}</span>
                  </div>

                  <div className="flex items-center gap-2.5 text-xs text-muted">
                    <Calendar className="h-4 w-4 text-muted shrink-0" />
                    <span>Added on {new Date(selectedLead.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Status Mutator */}
                <div className="border-t border-border pt-4 space-y-2">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Pipeline Status</h4>
                  <div className="grid grid-cols-3 gap-1.5">
                    {["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"].map((st) => (
                      <button
                        key={st}
                        onClick={() => handleStatusChange(st as LeadStatus)}
                        className={`h-8 px-1 rounded text-xs font-bold border transition-all cursor-pointer ${
                          selectedLead.status === st
                            ? "bg-primary border-border text-foreground shadow-sm"
                            : "bg-[#F4F5F1] border-transparent text-muted hover:text-foreground hover:bg-[rgba(17,17,17,0.04)]"
                        }`}
                      >
                        {formatStatus(st)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CRM Valuation */}
                <div className="border-t border-border pt-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-muted uppercase tracking-wider block">Estimated Value</span>
                    <p className="text-2xl font-extrabold text-foreground mt-0.5">
                      {formatCurrency(selectedLead.value)}
                    </p>
                  </div>
                  <div className="h-10 w-10 bg-primary/40 border border-border rounded-lg flex items-center justify-center text-foreground">
                    <Coins className="h-5 w-5" />
                  </div>
                </div>

                {/* Notes Block */}
                <div className="border-t border-border pt-4 space-y-2">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" /> Memo / Log Notes
                  </h4>
                  {selectedLead.notes ? (
                    <p className="text-sm text-muted bg-[#F4F5F1] border border-border p-4 rounded-xl leading-relaxed whitespace-pre-wrap">
                      {selectedLead.notes}
                    </p>
                  ) : (
                    <p className="text-xs italic text-muted">No notes written for this lead profile.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="sticky top-22 hidden lg:block border-dashed border-border bg-[#F4F5F1]">
              <CardContent className="py-24 text-center flex flex-col items-center gap-2.5">
                <Info className="h-8 w-8 text-muted" />
                <h4 className="text-sm font-bold text-foreground">Inspect Lead Details</h4>
                <p className="text-xs text-muted max-w-[200px] leading-relaxed">
                  Select any prospect record in the directory to review profile fields, edit parameters, log valuation, or alter statuses.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Floating Create Lead Modal */}
      <Dialog
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Log CRM Lead"
        description="Insert secure contact coordinates to seed a CRM prospect profile."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {actionError && (
            <div className="p-3 text-xs bg-red-50 border border-red-100 text-red-700 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider">First Name *</label>
              <Input
                type="text"
                name="firstName"
                placeholder="Sarah"
                value={formValues.firstName || ""}
                onChange={handleInputChange}
                className={validationErrors.firstName ? "border-red-500/50" : ""}
                required
              />
              {validationErrors.firstName && (
                <span className="text-[9px] text-red-600 font-semibold block">{validationErrors.firstName}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Last Name</label>
              <Input
                type="text"
                name="lastName"
                placeholder="Jenkins"
                value={formValues.lastName || ""}
                onChange={handleInputChange}
                className={validationErrors.lastName ? "border-red-500/50" : ""}
              />
              {validationErrors.lastName && (
                <span className="text-[9px] text-red-600 font-semibold block">{validationErrors.lastName}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Email Address</label>
              <Input
                type="email"
                name="email"
                placeholder="sarah@acme.com"
                value={formValues.email || ""}
                onChange={handleInputChange}
                className={validationErrors.email ? "border-red-500/50" : ""}
              />
              {validationErrors.email && (
                <span className="text-[9px] text-red-600 font-semibold block">{validationErrors.email}</span>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Phone Number</label>
              <Input
                type="tel"
                name="phone"
                placeholder="+1 (555) 392-1200"
                value={formValues.phone || ""}
                onChange={handleInputChange}
                className={validationErrors.phone ? "border-red-500/50" : ""}
              />
              {validationErrors.phone && (
                <span className="text-[9px] text-red-600 font-semibold block">{validationErrors.phone}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Company / Org</label>
              <Input
                type="text"
                name="company"
                placeholder="e.g. Acme Corp"
                value={formValues.company || ""}
                onChange={handleInputChange}
                className={validationErrors.company ? "border-red-500/50" : ""}
              />
              {validationErrors.company && (
                <span className="text-[9px] text-red-600 font-semibold block">{validationErrors.company}</span>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Lead Source</label>
              <Input
                type="text"
                name="source"
                placeholder="Inbound Form, Cold Outreach"
                value={formValues.source || ""}
                onChange={handleInputChange}
                className={validationErrors.source ? "border-red-500/50" : ""}
              />
              {validationErrors.source && (
                <span className="text-[9px] text-red-600 font-semibold block">{validationErrors.source}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Valuation ($)</label>
              <Input
                type="number"
                name="value"
                placeholder="5000"
                value={formValues.value ?? 0}
                onChange={handleInputChange}
                className={validationErrors.value ? "border-red-500/50" : ""}
              />
              {validationErrors.value && (
                <span className="text-[9px] text-red-600 font-semibold block">{validationErrors.value}</span>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Initial Status</label>
              <select
                name="status"
                value={formValues.status}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none input-focus"
              >
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="PROPOSAL">Proposal</option>
                <option value="WON">Won</option>
                <option value="LOST">Lost</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Memo / Internal Notes</label>
            <Textarea
              name="notes"
              placeholder="Provide background context on this prospect..."
              value={formValues.notes || ""}
              onChange={handleInputChange}
              rows={3}
              className={validationErrors.notes ? "border-red-500/50" : ""}
            />
            {validationErrors.notes && (
              <span className="text-[9px] text-red-600 font-semibold block">{validationErrors.notes}</span>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="flex items-center gap-1.5">
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Create Lead
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Floating Edit Lead Modal */}
      <Dialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Lead Parameters"
        description="Update CRM catalog metrics and details."
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {actionError && (
            <div className="p-3 text-xs bg-red-50 border border-red-100 text-red-700 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider">First Name *</label>
              <Input
                type="text"
                name="firstName"
                placeholder="Sarah"
                value={formValues.firstName || ""}
                onChange={handleInputChange}
                className={validationErrors.firstName ? "border-red-500/50" : ""}
                required
              />
              {validationErrors.firstName && (
                <span className="text-[9px] text-red-600 font-semibold block">{validationErrors.firstName}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Last Name</label>
              <Input
                type="text"
                name="lastName"
                placeholder="Jenkins"
                value={formValues.lastName || ""}
                onChange={handleInputChange}
                className={validationErrors.lastName ? "border-red-500/50" : ""}
              />
              {validationErrors.lastName && (
                <span className="text-[9px] text-red-600 font-semibold block">{validationErrors.lastName}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Email Address</label>
              <Input
                type="email"
                name="email"
                placeholder="sarah@acme.com"
                value={formValues.email || ""}
                onChange={handleInputChange}
                className={validationErrors.email ? "border-red-500/50" : ""}
              />
              {validationErrors.email && (
                <span className="text-[9px] text-red-600 font-semibold block">{validationErrors.email}</span>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Phone Number</label>
              <Input
                type="tel"
                name="phone"
                placeholder="+1 (555) 392-1200"
                value={formValues.phone || ""}
                onChange={handleInputChange}
                className={validationErrors.phone ? "border-red-500/50" : ""}
              />
              {validationErrors.phone && (
                <span className="text-[9px] text-red-600 font-semibold block">{validationErrors.phone}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Company / Org</label>
              <Input
                type="text"
                name="company"
                placeholder="Acme Corp"
                value={formValues.company || ""}
                onChange={handleInputChange}
                className={validationErrors.company ? "border-red-500/50" : ""}
              />
              {validationErrors.company && (
                <span className="text-[9px] text-red-600 font-semibold block">{validationErrors.company}</span>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Lead Source</label>
              <Input
                type="text"
                name="source"
                placeholder="Inbound Form"
                value={formValues.source || ""}
                onChange={handleInputChange}
                className={validationErrors.source ? "border-red-500/50" : ""}
              />
              {validationErrors.source && (
                <span className="text-[9px] text-red-600 font-semibold block">{validationErrors.source}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Valuation ($)</label>
              <Input
                type="number"
                name="value"
                placeholder="5000"
                value={formValues.value ?? 0}
                onChange={handleInputChange}
                className={validationErrors.value ? "border-red-500/50" : ""}
              />
              {validationErrors.value && (
                <span className="text-[9px] text-red-600 font-semibold block">{validationErrors.value}</span>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Active Status</label>
              <select
                name="status"
                value={formValues.status}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none input-focus"
              >
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="PROPOSAL">Proposal</option>
                <option value="WON">Won</option>
                <option value="LOST">Lost</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Memo / Internal Notes</label>
            <Textarea
              name="notes"
              placeholder="Background memo details..."
              value={formValues.notes || ""}
              onChange={handleInputChange}
              rows={3}
              className={validationErrors.notes ? "border-red-500/50" : ""}
            />
            {validationErrors.notes && (
              <span className="text-[9px] text-red-600 font-semibold block">{validationErrors.notes}</span>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="flex items-center gap-1.5">
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
