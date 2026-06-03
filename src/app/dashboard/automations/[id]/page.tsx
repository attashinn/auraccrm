"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Tag,
  Clock,
  Shield,
  UserCheck,
  Zap,
  Activity,
  X,
  Mail,
  Sliders,
  GitBranch,
  Globe,
  Settings,
  Maximize2,
  Minus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getAutomationByIdAction, saveAutomationAction } from "@/actions/automations";

interface ActionStep {
  id: string; // client-side temp ID or DB step ID
  stepType: string;
  stepConfig: any;
}

export default function EditAutomationPage() {
  const router = useRouter();
  const params = useParams();
  const automationId = params.id as string;

  // Workflow details
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState("new_message");
  const [triggerConfig, setTriggerConfig] = useState<any>({
    keywords: "",
    matchType: "contains"
  });
  const [steps, setSteps] = useState<ActionStep[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [triggerExpanded, setTriggerExpanded] = useState(true);

  // Zoom & Pan Canvas States
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Floating Actions Dropdown Selector
  const [showSelectorIndex, setShowSelectorIndex] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch automation details
  useEffect(() => {
    const loadAutomation = async () => {
      setIsLoading(true);
      const res = await getAutomationByIdAction(automationId);
      if (res.success && res.data) {
        const data = res.data;
        setName(data.name);
        setDescription(data.description || "");
        setTriggerType(data.triggerType);
        
        const triggerConf = (data.triggerConfig as any) || {};
        setTriggerConfig({
          keywords: Array.isArray(triggerConf.keywords) 
            ? triggerConf.keywords.join(", ") 
            : triggerConf.keywords || "",
          matchType: triggerConf.matchType || "contains"
        });
        
        setIsActive(data.isActive);
        
        const actionSteps = (data.steps || []).map((s: any) => ({
          id: s.id,
          stepType: s.stepType,
          stepConfig: s.stepConfig || {}
        }));
        setSteps(actionSteps);
      } else {
        toast.error(res.error || "Failed to load workflow");
        router.push("/dashboard/automations");
      }
      setIsLoading(false);
    };

    if (automationId) {
      loadAutomation();
    }
  }, [automationId, router]);

  // Click outside to close actions dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSelectorIndex(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Zoom/Pan mouse dragging handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest(".canvas-node") || target.closest(".canvas-controls") || target.closest("button") || target.closest("select") || target.closest("input") || target.closest("textarea")) {
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom wheel handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 0.05;
    const nextZoom = e.deltaY < 0 ? zoom + zoomFactor : zoom - zoomFactor;
    setZoom(Math.min(2.0, Math.max(0.3, nextZoom)));
  };

  const zoomIn = () => setZoom(Math.min(2.0, zoom + 0.1));
  const zoomOut = () => setZoom(Math.max(0.3, zoom - 0.1));
  const resetZoomAndPan = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Steps Manipulation
  const addStepAt = (index: number, type: string) => {
    const newStep: ActionStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      stepType: type,
      stepConfig: getDefaultConfig(type)
    };
    const updated = [...steps];
    updated.splice(index, 0, newStep);
    setSteps(updated);
    setShowSelectorIndex(null);
    toast.success("Action step added successfully");
  };

  const getDefaultConfig = (type: string) => {
    switch (type) {
      case "send_message":
        return { messageText: "" };
      case "send_template":
        return { templateName: "", language: "en_US" };
      case "add_tag":
      case "remove_tag":
        return { tagName: "" };
      case "assign_conversation":
        return { assignedAgentId: "" };
      case "update_field":
        return { fieldName: "", fieldValue: "" };
      case "create_deal":
        return { dealName: "", dealValue: 0, dealStage: "NEW" };
      case "wait_delay":
        return { delayValue: 5, delayUnit: "minutes" };
      case "condition_if":
        return { conditionField: "message", operator: "contains", matchingValue: "" };
      case "send_webhook":
        return { webhookUrl: "", payloadText: "" };
      case "close_conversation":
      default:
        return {};
    }
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter((s) => s.id !== id));
    toast.info("Action step deleted");
  };

  const updateStepConfig = (id: string, configUpdates: any) => {
    setSteps(
      steps.map((s) =>
        s.id === id ? { ...s, stepConfig: { ...s.stepConfig, ...configUpdates } } : s
      )
    );
  };

  // Re-ordering steps
  const moveStep = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === steps.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const reordered = [...steps];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;
    setSteps(reordered);
  };

  // Update in db
  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a workflow name");
      return;
    }

    setIsSaving(true);
    const dbSteps = steps.map((s) => ({
      stepType: s.stepType,
      stepConfig: s.stepConfig
    }));

    const res = await saveAutomationAction({
      id: automationId,
      name,
      description,
      triggerType,
      triggerConfig,
      isActive,
      steps: dbSteps
    });

    if (res.success) {
      toast.success("Workflow updated successfully!");
      router.push("/dashboard/automations");
    } else {
      toast.error(res.error || "Failed to update workflow");
    }
    setIsSaving(false);
  };

  const getTriggerTitle = (type: string) => {
    switch (type) {
      case "new_message":
        return "New Message Received";
      case "first_message":
        return "First Message from Contact";
      case "keyword_match":
        return "Keyword Match";
      case "new_contact":
        return "New Contact Created";
      case "conversation_assigned":
        return "Conversation Assigned";
      case "tag_added":
        return "Tag Added";
      case "time_based":
        return "Time-Based Scheduler";
      default:
        return "Trigger";
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-150px)] md:h-[calc(100vh-165px)] w-full bg-[#0b0e14] items-center justify-center rounded-3xl border border-gray-800">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
          <span className="text-xs text-gray-400 font-medium">Loading automation builder...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-150px)] md:h-[calc(100vh-165px)] w-full bg-[#0b0e14] text-gray-200 overflow-hidden rounded-3xl border border-gray-800 shadow-2xl relative font-sans">
      
      {/* Top Header bar */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-[#0f131a] border-b border-gray-800 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/automations">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-gray-800/80 text-gray-400">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="space-y-0.5">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-base font-extrabold text-white focus:outline-none border-b border-transparent hover:border-gray-700 focus:border-violet-500 bg-transparent px-1 transition-colors"
            />
            <input
              type="text"
              placeholder="Add optional workflow description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-[11px] text-gray-400 focus:outline-none border-b border-transparent hover:border-gray-700 focus:border-violet-500 bg-transparent px-1 w-64 md:w-96 transition-colors block"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">
              {isActive ? "Active" : "Active Toggle"}
            </span>
            <button
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-5.5 w-10.5 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isActive ? "bg-violet-600" : "bg-gray-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-xl px-4 py-2 text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shrink-0 border border-violet-500/20"
          >
            {isSaving ? "Saving..." : "Save Workflow"}
          </Button>
        </div>
      </div>

      {/* INFINITE CANVAS INTERACTIVE WORKSPACE */}
      <div 
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          cursor: isDragging ? "grabbing" : "grab",
          backgroundImage: "radial-gradient(rgba(139, 92, 246, 0.15) 1.5px, transparent 1.5px)",
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`
        }}
        className="flex-1 w-full bg-[#0b0e14] relative overflow-hidden select-none"
      >
        {/* Transform Group */}
        <div 
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0"
          }}
          className="absolute left-1/4 top-16 flex flex-col items-center gap-0 transition-transform duration-75 ease-out"
        >
          
          {/* TRIGGER NODE */}
          <div className="canvas-node w-[420px] rounded-2xl border border-[#2a3042] bg-[#111421] shadow-2xl overflow-hidden text-left">
            <div 
              onClick={() => setTriggerExpanded(!triggerExpanded)}
              className="flex items-center justify-between px-4.5 py-3.5 border-b border-[#202537] bg-[#161b2d] cursor-pointer hover:bg-[#1a2036] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-violet-600 text-white flex items-center justify-center shadow-lg">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-violet-400 tracking-wider">Trigger</span>
                  <h4 className="text-xs font-black text-white">{getTriggerTitle(triggerType)}</h4>
                </div>
              </div>
              {triggerExpanded ? <ChevronUp className="h-4 w-4 text-violet-400" /> : <ChevronDown className="h-4 w-4 text-violet-400" />}
            </div>

            {triggerExpanded && (
              <div className="p-4.5 space-y-4 bg-[#111421]">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Trigger Type</label>
                  <select
                    value={triggerType}
                    onChange={(e) => setTriggerType(e.target.value)}
                    className="flex h-9 w-full rounded-lg border border-[#242b3d] bg-[#181d2c] px-3 py-1 text-xs text-white focus:outline-none focus:border-violet-500 transition-colors"
                  >
                    <option value="new_message">New Message Received</option>
                    <option value="first_message">First Message from Contact</option>
                    <option value="keyword_match">Keyword Match</option>
                  </select>
                </div>

                {triggerType === "keyword_match" && (
                  <div className="space-y-3.5 pt-1 animate-in slide-in-from-top-2 duration-150">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Keywords (comma-separated)</label>
                      <Input
                        type="text"
                        placeholder="e.g. price, cost"
                        value={triggerConfig.keywords || ""}
                        onChange={(e) => setTriggerConfig({ ...triggerConfig, keywords: e.target.value })}
                        className="bg-[#181d2c] border-[#242b3d] text-white focus:border-violet-500 rounded-lg text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Match Type</label>
                      <select
                        value={triggerConfig.matchType || "contains"}
                        onChange={(e) => setTriggerConfig({ ...triggerConfig, matchType: e.target.value })}
                        className="flex h-9 w-full rounded-lg border border-[#242b3d] bg-[#181d2c] px-3 py-1 text-xs text-white focus:outline-none focus:border-violet-500 transition-colors"
                      >
                        <option value="contains">Contains</option>
                        <option value="exact">Exact match</option>
                        <option value="starts_with">Starts with</option>
                        <option value="ends_with">Ends with</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CONNECTOR LINE + SELECTOR */}
          <div className="h-10 w-0.5 bg-violet-500/30 relative flex items-center justify-center">
            <button 
              onClick={() => setShowSelectorIndex(0)}
              className="absolute h-6 w-6 rounded-full bg-[#1b1e2c] border border-violet-500/80 hover:bg-violet-600/20 hover:scale-110 active:scale-95 text-violet-400 flex items-center justify-center cursor-pointer transition-all z-10"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* ACTION NODES SEQUENTIAL RENDER */}
          {steps.map((step, index) => {
            return (
              <React.Fragment key={step.id}>
                <div className="canvas-node w-[420px] rounded-2xl border border-[#23293a] bg-[#111421] shadow-xl overflow-hidden text-left relative group">
                  
                  {/* Step Header */}
                  <div className="flex items-center justify-between px-4.5 py-3 border-b border-[#202537] bg-[#161b2d]/80">
                    <div className="flex items-center gap-2">
                      <div className="h-5.5 w-5.5 rounded bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center text-[10px] font-black">
                        {index + 1}
                      </div>
                      <h4 className="text-[11px] font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                        {step.stepType.replace("_", " ")}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => moveStep(index, "up")}
                        disabled={index === 0}
                        className="h-6.5 w-6.5 rounded-md hover:bg-gray-800 disabled:opacity-20 text-gray-400"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => moveStep(index, "down")}
                        disabled={index === steps.length - 1}
                        className="h-6.5 w-6.5 rounded-md hover:bg-gray-800 disabled:opacity-20 text-gray-400"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                      <button 
                        onClick={() => removeStep(step.id)}
                        className="h-6.5 w-6.5 rounded-md text-gray-400 hover:text-rose-500 hover:bg-rose-950/20 flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Step Form fields based on stepType */}
                  <div className="p-4 bg-[#111421]">
                    
                    {step.stepType === "send_message" && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Reply Message Text *</label>
                          <span className="text-[9px] text-gray-500">Use {"{first_name}"} or {"{phone}"}</span>
                        </div>
                        <textarea
                          value={step.stepConfig.messageText || ""}
                          onChange={(e) => updateStepConfig(step.id, { messageText: e.target.value })}
                          placeholder="Type reply message body here..."
                          rows={3}
                          className="flex w-full rounded-lg border border-[#242b3d] bg-[#181d2c] px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 resize-none font-medium"
                        />
                      </div>
                    )}

                    {step.stepType === "send_template" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Template Name *</label>
                          <Input
                            placeholder="e.g. welcome_broadcast"
                            value={step.stepConfig.templateName || ""}
                            onChange={(e) => updateStepConfig(step.id, { templateName: e.target.value })}
                            className="bg-[#181d2c] border-[#242b3d] text-white focus:border-violet-500 rounded-lg text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Language Code</label>
                          <Input
                            placeholder="en_US"
                            value={step.stepConfig.language || "en_US"}
                            onChange={(e) => updateStepConfig(step.id, { language: e.target.value })}
                            className="bg-[#181d2c] border-[#242b3d] text-white focus:border-violet-500 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {step.stepType === "add_tag" && (
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Tag to Add *</label>
                        <Input
                          placeholder="e.g. Hot Lead"
                          value={step.stepConfig.tagName || ""}
                          onChange={(e) => updateStepConfig(step.id, { tagName: e.target.value })}
                          className="bg-[#181d2c] border-[#242b3d] text-white focus:border-violet-500 rounded-lg text-xs"
                        />
                      </div>
                    )}

                    {step.stepType === "remove_tag" && (
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Tag to Remove *</label>
                        <Input
                          placeholder="e.g. Out of Office"
                          value={step.stepConfig.tagName || ""}
                          onChange={(e) => updateStepConfig(step.id, { tagName: e.target.value })}
                          className="bg-[#181d2c] border-[#242b3d] text-white focus:border-violet-500 rounded-lg text-xs"
                        />
                      </div>
                    )}

                    {step.stepType === "assign_conversation" && (
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Assign Agent Membership ID *</label>
                        <Input
                          placeholder="Membership UUID"
                          value={step.stepConfig.assignedAgentId || ""}
                          onChange={(e) => updateStepConfig(step.id, { assignedAgentId: e.target.value })}
                          className="bg-[#181d2c] border-[#242b3d] text-white focus:border-violet-500 rounded-lg text-xs"
                        />
                      </div>
                    )}

                    {step.stepType === "update_field" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Field Name *</label>
                          <Input
                            placeholder="e.g. Budget"
                            value={step.stepConfig.fieldName || ""}
                            onChange={(e) => updateStepConfig(step.id, { fieldName: e.target.value })}
                            className="bg-[#181d2c] border-[#242b3d] text-white focus:border-violet-500 rounded-lg text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Field Value</label>
                          <Input
                            placeholder="e.g. $5000"
                            value={step.stepConfig.fieldValue || ""}
                            onChange={(e) => updateStepConfig(step.id, { fieldValue: e.target.value })}
                            className="bg-[#181d2c] border-[#242b3d] text-white focus:border-violet-500 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {step.stepType === "create_deal" && (
                      <div className="space-y-3.5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Deal Name *</label>
                            <Input
                              placeholder="e.g. CRM Software Deal"
                              value={step.stepConfig.dealName || ""}
                              onChange={(e) => updateStepConfig(step.id, { dealName: e.target.value })}
                              className="bg-[#181d2c] border-[#242b3d] text-white focus:border-violet-500 rounded-lg text-xs"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Deal Value ($)</label>
                            <Input
                              type="number"
                              placeholder="e.g. 500"
                              value={step.stepConfig.dealValue || 0}
                              onChange={(e) => updateStepConfig(step.id, { dealValue: parseFloat(e.target.value) || 0 })}
                              className="bg-[#181d2c] border-[#242b3d] text-white focus:border-violet-500 rounded-lg text-xs"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Deal Stage</label>
                          <select
                            value={step.stepConfig.dealStage || "NEW"}
                            onChange={(e) => updateStepConfig(step.id, { dealStage: e.target.value })}
                            className="flex h-9 w-full rounded-lg border border-[#242b3d] bg-[#181d2c] px-3 py-1 text-xs text-white focus:outline-none focus:border-violet-500"
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
                    )}

                    {step.stepType === "wait_delay" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Delay Duration</label>
                          <Input
                            type="number"
                            value={step.stepConfig.delayValue || 5}
                            onChange={(e) => updateStepConfig(step.id, { delayValue: parseInt(e.target.value) || 1 })}
                            className="bg-[#181d2c] border-[#242b3d] text-white focus:border-violet-500 rounded-lg text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Delay Unit</label>
                          <select
                            value={step.stepConfig.delayUnit || "minutes"}
                            onChange={(e) => updateStepConfig(step.id, { delayUnit: e.target.value })}
                            className="flex h-9 w-full rounded-lg border border-[#242b3d] bg-[#181d2c] px-3 py-1 text-xs text-white focus:outline-none focus:border-violet-500"
                          >
                            <option value="minutes">Minutes</option>
                            <option value="hours">Hours</option>
                            <option value="days">Days</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {step.stepType === "condition_if" && (
                      <div className="space-y-3.5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Field</label>
                            <select
                              value={step.stepConfig.conditionField || "message"}
                              onChange={(e) => updateStepConfig(step.id, { conditionField: e.target.value })}
                              className="flex h-9 w-full rounded-lg border border-[#242b3d] bg-[#181d2c] px-3 py-1 text-xs text-white focus:outline-none focus:border-violet-500"
                            >
                              <option value="message">Inbound message body</option>
                              <option value="contact_name">Contact first name</option>
                              <option value="tag">Contact tags</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Operator</label>
                            <select
                              value={step.stepConfig.operator || "contains"}
                              onChange={(e) => updateStepConfig(step.id, { operator: e.target.value })}
                              className="flex h-9 w-full rounded-lg border border-[#242b3d] bg-[#181d2c] px-3 py-1 text-xs text-white focus:outline-none focus:border-violet-500"
                            >
                              <option value="contains">Contains</option>
                              <option value="equals">Equals</option>
                              <option value="starts_with">Starts with</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Value to Compare *</label>
                          <Input
                            placeholder="Value..."
                            value={step.stepConfig.matchingValue || ""}
                            onChange={(e) => updateStepConfig(step.id, { matchingValue: e.target.value })}
                            className="bg-[#181d2c] border-[#242b3d] text-white focus:border-violet-500 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {step.stepType === "send_webhook" && (
                      <div className="space-y-3.5">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Webhook URL *</label>
                          <Input
                            placeholder="https://api.yourdomain.com/webhook"
                            value={step.stepConfig.webhookUrl || ""}
                            onChange={(e) => updateStepConfig(step.id, { webhookUrl: e.target.value })}
                            className="bg-[#181d2c] border-[#242b3d] text-white focus:border-violet-500 rounded-lg text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">JSON Payload</label>
                          <textarea
                            placeholder='{"key": "value"}'
                            value={step.stepConfig.payloadText || ""}
                            onChange={(e) => updateStepConfig(step.id, { payloadText: e.target.value })}
                            rows={3}
                            className="flex w-full rounded-lg border border-[#242b3d] bg-[#181d2c] px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 resize-none font-mono"
                          />
                        </div>
                      </div>
                    )}

                    {step.stepType === "close_conversation" && (
                      <p className="text-[11px] text-gray-400 italic">
                        Marks the WhatsApp conversation thread status as completed/closed.
                      </p>
                    )}

                  </div>

                </div>

                {/* CONNECTOR LINE + SELECTOR */}
                <div className="h-10 w-0.5 bg-violet-500/30 relative flex items-center justify-center">
                  <button 
                    onClick={() => setShowSelectorIndex(index + 1)}
                    className="absolute h-6 w-6 rounded-full bg-[#1b1e2c] border border-violet-500/80 hover:bg-violet-600/20 hover:scale-110 active:scale-95 text-violet-400 flex items-center justify-center cursor-pointer transition-all z-10"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </React.Fragment>
            );
          })}

        </div>

        {/* FLOATING ACTION NODE CHOOSER */}
        {showSelectorIndex !== null && (
          <div 
            ref={dropdownRef}
            style={{
              left: `calc(35% + ${pan.x}px)`,
              top: `calc(120px + ${pan.y}px + ${showSelectorIndex * 150 * zoom}px)`
            }}
            className="absolute z-50 w-60 rounded-xl border border-gray-800 bg-[#0f131a] shadow-2xl p-1.5 animate-in zoom-in-95 duration-100"
          >
            <div className="px-2.5 py-1.5 text-[9px] font-black text-gray-500 uppercase tracking-wider border-b border-gray-800">
              Select action to insert
            </div>
            <div className="max-h-64 overflow-y-auto mt-1 scrollbar-thin">
              <button 
                onClick={() => addStepAt(showSelectorIndex, "send_message")}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg text-left transition-colors"
              >
                <MessageSquare className="h-4 w-4 text-sky-400" /> Send Message
              </button>
              <button 
                onClick={() => addStepAt(showSelectorIndex, "send_template")}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg text-left transition-colors"
              >
                <Mail className="h-4 w-4 text-violet-400" /> Send Template
              </button>
              <button 
                onClick={() => addStepAt(showSelectorIndex, "add_tag")}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg text-left transition-colors"
              >
                <Tag className="h-4 w-4 text-emerald-400" /> Add Tag
              </button>
              <button 
                onClick={() => addStepAt(showSelectorIndex, "remove_tag")}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg text-left transition-colors"
              >
                <Tag className="h-4 w-4 text-rose-400" /> Remove Tag
              </button>
              <button 
                onClick={() => addStepAt(showSelectorIndex, "assign_conversation")}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg text-left transition-colors"
              >
                <UserCheck className="h-4 w-4 text-amber-400" /> Assign Conversation
              </button>
              <button 
                onClick={() => addStepAt(showSelectorIndex, "update_field")}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg text-left transition-colors"
              >
                <Sliders className="h-4 w-4 text-indigo-400" /> Update Contact Field
              </button>
              <button 
                onClick={() => addStepAt(showSelectorIndex, "create_deal")}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg text-left transition-colors"
              >
                <Shield className="h-4 w-4 text-teal-400" /> Create Deal
              </button>
              <button 
                onClick={() => addStepAt(showSelectorIndex, "wait_delay")}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg text-left transition-colors"
              >
                <Clock className="h-4 w-4 text-orange-400" /> Wait
              </button>
              <button 
                onClick={() => addStepAt(showSelectorIndex, "condition_if")}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg text-left transition-colors"
              >
                <GitBranch className="h-4 w-4 text-purple-400" /> Condition (If/Else)
              </button>
              <button 
                onClick={() => addStepAt(showSelectorIndex, "send_webhook")}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg text-left transition-colors"
              >
                <Globe className="h-4 w-4 text-cyan-400" /> Send Webhook
              </button>
              <button 
                onClick={() => addStepAt(showSelectorIndex, "close_conversation")}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg text-left transition-colors"
              >
                <X className="h-4 w-4 text-pink-400" /> Close Conversation
              </button>
            </div>
          </div>
        )}

        {/* CANVAS ZOOM/PAN CONTROLS */}
        <div className="canvas-controls absolute bottom-6 right-6 z-20 flex items-center gap-1.5 bg-[#0f131a]/95 border border-gray-800 p-1.5 rounded-xl shadow-2xl">
          <Button 
            onClick={zoomOut}
            variant="ghost" 
            size="icon" 
            className="h-8.5 w-8.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="text-[10px] font-black text-gray-300 px-2 min-w-[44px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button 
            onClick={zoomIn}
            variant="ghost" 
            size="icon" 
            className="h-8.5 w-8.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <div className="w-px h-5 bg-gray-800 mx-0.5"></div>
          <Button 
            onClick={resetZoomAndPan}
            variant="ghost" 
            size="icon" 
            className="h-8.5 w-8.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </div>

      </div>

    </div>
  );
}
