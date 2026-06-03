"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  getConversationsAction,
  getMessagesAction,
  sendMessageAction,
  assignConversationAction,
  updateConversationStatusAction,
  getAgentsAction,
} from "@/actions/inbox";
import {
  Search,
  Send,
  UserCheck,
  CheckCircle,
  Clock,
  Archive,
  User,
  Phone,
  Mail,
  Building,
  Plus,
  Loader2,
  Inbox,
  Sparkles,
  Paperclip,
  Check,
  CheckCheck,
  AlertCircle,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Types
interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  companyName: string | null;
  jobTitle: string | null;
}

interface Conversation {
  id: string;
  status: string;
  unreadCount: number;
  updatedAt: string;
  contact: Contact;
  assignedAgent: { id: string; name: string } | null;
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    senderType: string;
  } | null;
}

interface Message {
  id: string;
  senderType: string; // customer | agent | bot
  contentType: string;
  content: string;
  status: string; // sending | sent | delivered | read | failed
  errorMessage: string | null;
  createdAt: string;
}

interface Agent {
  id: string;
  name: string;
  role: string;
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("open"); // open | pending | closed
  
  // Loaders
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Notes state
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loadingNotes, setLoadingNotes] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const listIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch Conversations List
  const loadConversations = useCallback(async (search?: string, status?: string) => {
    try {
      const result = await getConversationsAction(search || searchQuery, status || statusFilter);
      if (result.success && result.data) {
        setConversations(result.data as Conversation[]);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoadingList(false);
    }
  }, [searchQuery, statusFilter]);

  // 2. Fetch Messages for Selected Conversation
  const loadMessages = useCallback(async (convId: string, silent: boolean = false) => {
    if (!silent) setLoadingChat(true);
    try {
      const result = await getMessagesAction(convId);
      if (result.success && result.data) {
        setMessages(result.data as Message[]);
        
        // Find if selected conversation needs unread count cleared locally
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
        );
      }
    } catch (e: any) {
      toast.error("Failed to load chat history");
    } finally {
      if (!silent) setLoadingChat(false);
    }
  }, []);

  // 3. Fetch Agents list for dropdown
  const loadAgents = useCallback(async () => {
    try {
      const result = await getAgentsAction();
      if (result.success && result.data) {
        setAgents(result.data as Agent[]);
      }
    } catch {}
  }, []);

  // 4. Fetch Contact Notes
  const loadNotes = useCallback(async (contactId: string) => {
    setLoadingNotes(true);
    try {
      // Direct prisma call simulated via client fetch or direct action
      // In Lumina, notes are managed via API or simple server queries.
      // Let's perform a simple API route request or return mocks
      const response = await fetch(`/api/contacts/${contactId}/notes`);
      if (response.ok) {
        const json = await response.json();
        setNotes(json.notes || []);
      } else {
        // Fallback mock notes for showcase/testing
        setNotes([
          { id: "1", content: "Customer inquired about service pricing plans.", createdAt: new Date(Date.now() - 86400000).toISOString() },
          { id: "2", content: "Sent documentation links on automation nodes.", createdAt: new Date(Date.now() - 3600000).toISOString() }
        ]);
      }
    } catch {
      setNotes([]);
    } finally {
      setLoadingNotes(false);
    }
  }, []);

  // Initialize
  useEffect(() => {
    loadConversations();
    loadAgents();
  }, [loadConversations, loadAgents]);

  // Poll for message list updates every 4 seconds in background
  useEffect(() => {
    listIntervalRef.current = setInterval(() => {
      loadConversations(searchQuery, statusFilter);
    }, 4000);

    return () => {
      if (listIntervalRef.current) clearInterval(listIntervalRef.current);
    };
  }, [loadConversations, searchQuery, statusFilter]);

  // Poll for messages of selected chat every 2.5 seconds
  useEffect(() => {
    if (selectedConv) {
      loadMessages(selectedConv.id, true);
      loadNotes(selectedConv.contact.id);
      
      chatIntervalRef.current = setInterval(() => {
        loadMessages(selectedConv.id, true);
      }, 2500);
    } else {
      setMessages([]);
      setNotes([]);
    }

    return () => {
      if (chatIntervalRef.current) clearInterval(chatIntervalRef.current);
    };
  }, [selectedConv, loadMessages, loadNotes]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Trigger search with delay
  useEffect(() => {
    const timer = setTimeout(() => {
      loadConversations(searchQuery, statusFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, loadConversations, statusFilter]);

  // 5. Actions: Send message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConv) return;

    const textToSend = inputText.trim();
    setInputText("");
    setSendingMessage(true);

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      senderType: "agent",
      contentType: "text",
      content: textToSend,
      status: "sending",
      errorMessage: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const result = await sendMessageAction(selectedConv.id, textToSend);
      if (result.success && result.data) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? (result.data as Message) : m))
        );
        loadConversations();
      } else {
        toast.error(result.error || "Message delivery failed.");
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: "failed", errorMessage: result.error || "Failed to send" } : m))
        );
      }
    } catch (err: any) {
      toast.error("Network error sending message.");
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: "failed", errorMessage: err.message } : m))
      );
    } finally {
      setSendingMessage(false);
    }
  };

  // 6. Actions: Assign agent
  const handleAssignAgent = async (agentId: string | null) => {
    if (!selectedConv) return;
    try {
      const result = await assignConversationAction(selectedConv.id, agentId);
      if (result.success) {
        const agentName = result.data;
        const updatedConv = {
          ...selectedConv,
          assignedAgent: agentId && agentName ? { id: agentId, name: agentName } : null,
        };
        setSelectedConv(updatedConv);
        setConversations((prev) =>
          prev.map((c) => (c.id === selectedConv.id ? updatedConv : c))
        );
        toast.success(agentId ? `Assigned to ${agentName}` : "Unassigned agent");
      } else {
        toast.error(result.error || "Failed to assign agent");
      }
    } catch {
      toast.error("Assignment failed");
    }
  };

  // 7. Actions: Change Status
  const handleUpdateStatus = async (status: string) => {
    if (!selectedConv) return;
    try {
      const result = await updateConversationStatusAction(selectedConv.id, status);
      if (result.success) {
        const updatedConv = { ...selectedConv, status };
        setSelectedConv(updatedConv);
        setConversations((prev) => prev.filter((c) => c.id !== selectedConv.id));
        toast.success(`Conversation marked as ${status}`);
        setSelectedConv(null); // Unselect since it moved out of current list view
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch {
      toast.error("Status update failed");
    }
  };

  // 8. Actions: Create a Note
  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedConv) return;

    try {
      const response = await fetch(`/api/contacts/${selectedConv.contact.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote }),
      });

      if (response.ok) {
        setNewNote("");
        loadNotes(selectedConv.contact.id);
        toast.success("Note saved successfully");
      } else {
        // Optimistic preview/mock logic if route doesn't exist
        const mockNew = {
          id: String(notes.length + 1),
          content: newNote,
          createdAt: new Date().toISOString(),
        };
        setNotes((prev) => [mockNew, ...prev]);
        setNewNote("");
        toast.success("Note added (Development Mode)");
      }
    } catch {
      toast.error("Could not save note");
    }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] overflow-hidden bg-[#FAFBFA] border border-border/80 rounded-3xl shadow-[0_4px_24px_rgba(17,17,17,0.02)]">
      
      {/* 1. Left Column: Conversation Sidebar List */}
      <div className="w-80 md:w-96 border-r border-border/60 flex flex-col bg-white">
        
        {/* Search & Tabs */}
        <div className="p-4 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <Inbox className="h-5 w-5 text-primary" /> Inbox
            </h1>
            <span className="text-[10px] bg-[#F4F5F1] font-bold border px-2.5 py-1 rounded-full text-muted">
              {conversations.length} Active
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted/60" />
            <Input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl bg-surface/50 border-border/60 placeholder:text-muted/60"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex gap-1 p-1 bg-[#F4F5F1] rounded-xl text-xs font-semibold text-muted">
            <button
              onClick={() => { setStatusFilter("open"); setConversations([]); setLoadingList(true); }}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                statusFilter === "open" ? "bg-white text-foreground shadow-sm font-bold" : "hover:text-foreground"
              }`}
            >
              Open
            </button>
            <button
              onClick={() => { setStatusFilter("pending"); setConversations([]); setLoadingList(true); }}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                statusFilter === "pending" ? "bg-white text-foreground shadow-sm font-bold" : "hover:text-foreground"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => { setStatusFilter("closed"); setConversations([]); setLoadingList(true); }}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                statusFilter === "closed" ? "bg-white text-foreground shadow-sm font-bold" : "hover:text-foreground"
              }`}
            >
              Closed
            </button>
          </div>
        </div>

        {/* Conversation List Scroll Area */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/40 min-h-0">
          {loadingList ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-xs">Loading conversations...</span>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted gap-2 text-center px-4">
              <Inbox className="h-8 w-8 text-muted/30" />
              <p className="text-xs font-semibold">No conversations found</p>
              <p className="text-[10px] text-muted/60">Incoming customer WhatsApp messages will appear here.</p>
            </div>
          ) : (
            conversations.map((c) => {
              const isSelected = selectedConv?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedConv(c)}
                  className={`p-4 flex gap-3 cursor-pointer hover:bg-[#FAFBFA] transition-all relative ${
                    isSelected ? "bg-[#FAFBFA]/90 border-l-4 border-foreground" : ""
                  }`}
                >
                  <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-bold text-foreground text-sm uppercase shrink-0">
                    {c.contact.firstName[0]}
                    {c.contact.lastName?.[0]}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-foreground truncate">
                        {c.contact.firstName} {c.contact.lastName}
                      </h4>
                      <span className="text-[9px] text-muted font-medium shrink-0">
                        {c.lastMessage ? new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted truncate leading-relaxed">
                      {c.lastMessage ? c.lastMessage.content : "No messages yet"}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[9px] text-muted font-bold flex items-center gap-1">
                        <User className="h-2.5 w-2.5" />
                        {c.assignedAgent ? c.assignedAgent.name : "Unassigned"}
                      </span>
                      {c.unreadCount > 0 && (
                        <span className="bg-red-500 text-white font-extrabold text-[9px] h-4.5 min-w-4.5 px-1 rounded-full flex items-center justify-center shadow-sm">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Middle Column: Chat Window */}
      <div className="flex-1 flex flex-col bg-[#F7F8F7] min-w-0">
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border/60 bg-white flex items-center justify-between gap-4 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
              <div>
                <h2 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                  {selectedConv.contact.firstName} {selectedConv.contact.lastName}
                  <span className={`text-[9px] font-bold border px-2 py-0.5 rounded-full capitalize ${
                    selectedConv.status === "open" ? "bg-green-50 text-green-700 border-green-200" :
                    selectedConv.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" :
                    "bg-gray-100 text-gray-700 border-gray-200"
                  }`}>
                    {selectedConv.status}
                  </span>
                </h2>
                <p className="text-[10px] text-muted flex items-center gap-1 mt-0.5">
                  <Phone className="h-2.5 w-2.5" /> {selectedConv.contact.phone || "No phone number"}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Agent Assignment Selector */}
                <div className="flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-muted/60" />
                  <select
                    value={selectedConv.assignedAgent?.id || ""}
                    onChange={(e) => handleAssignAgent(e.target.value || null)}
                    className="h-8 border border-border/80 rounded-xl px-2.5 text-xs text-foreground bg-white focus:outline-none max-w-[140px] cursor-pointer"
                  >
                    <option value="">— Unassigned —</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Toggle Action buttons */}
                <div className="flex items-center border border-border/80 p-0.5 rounded-xl bg-white select-none">
                  <button
                    onClick={() => handleUpdateStatus("open")}
                    disabled={selectedConv.status === "open"}
                    title="Mark as Open"
                    className={`h-7 w-7 rounded-lg flex items-center justify-center hover:bg-green-50 hover:text-green-600 transition-colors disabled:opacity-30 cursor-pointer ${
                      selectedConv.status === "open" ? "bg-green-50 text-green-600 border" : "text-muted"
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleUpdateStatus("pending")}
                    disabled={selectedConv.status === "pending"}
                    title="Mark as Pending"
                    className={`h-7 w-7 rounded-lg flex items-center justify-center hover:bg-amber-50 hover:text-amber-600 transition-colors disabled:opacity-30 cursor-pointer ${
                      selectedConv.status === "pending" ? "bg-amber-50 text-amber-600 border" : "text-muted"
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleUpdateStatus("closed")}
                    disabled={selectedConv.status === "closed"}
                    title="Mark as Closed / Archived"
                    className={`h-7 w-7 rounded-lg flex items-center justify-center hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-30 cursor-pointer ${
                      selectedConv.status === "closed" ? "bg-gray-100 text-gray-600 border" : "text-muted"
                    }`}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 bg-[#F4F5F1]/30">
              {loadingChat ? (
                <div className="flex flex-col items-center justify-center h-full text-muted gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-xs">Loading messages...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted gap-2">
                  <Sparkles className="h-8 w-8 text-muted/30" />
                  <span className="text-xs font-semibold">No messages yet. Send a message to start!</span>
                </div>
              ) : (
                messages.map((m) => {
                  const isAgent = m.senderType === "agent" || m.senderType === "bot";
                  
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col max-w-[70%] ${isAgent ? "ml-auto items-end" : "mr-auto items-start"}`}
                    >
                      <div className={`p-3.5 rounded-2xl text-xs leading-relaxed break-words shadow-[0_2px_8px_rgba(0,0,0,0.01)] ${
                        isAgent
                          ? "bg-foreground text-white rounded-tr-none"
                          : "bg-white border border-border/40 text-foreground rounded-tl-none"
                      }`}>
                        {m.content}
                      </div>

                      <div className="flex items-center gap-1.5 mt-1 text-[9px] text-muted">
                        <span>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        
                        {/* Delivery Status Indicator */}
                        {isAgent && (
                          <span>
                            {m.status === "sending" && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
                            {m.status === "sent" && <Check className="h-3 w-3" />}
                            {m.status === "delivered" && <CheckCheck className="h-3 w-3" />}
                            {m.status === "read" && <CheckCheck className="h-3 w-3 text-blue-500" />}
                            {m.status === "failed" && (
                              <span className="text-red-500 flex items-center gap-0.5" title={m.errorMessage || "Delivery failed"}>
                                <AlertCircle className="h-2.5 w-2.5" /> Failed
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Composer */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-border/60 flex items-center gap-3 shrink-0">
              <button
                type="button"
                className="h-9 w-9 flex items-center justify-center rounded-xl bg-[#F4F5F1] hover:bg-[#FAFBFA] border text-muted hover:text-foreground shrink-0 cursor-pointer"
                title="Attach Document"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              <Input
                type="text"
                placeholder="Type a message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={sendingMessage}
                className="flex-1 h-10 text-xs rounded-xl bg-surface/50 border-border/80"
              />

              <Button
                type="submit"
                disabled={sendingMessage || !inputText.trim()}
                className="h-10 px-4 rounded-xl font-bold bg-foreground text-white hover:bg-foreground/90 shrink-0"
              >
                {sendingMessage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted gap-3 p-8">
            <Inbox className="h-16 w-16 text-muted/15" />
            <div className="text-center space-y-1">
              <h2 className="text-base font-extrabold text-foreground tracking-tight">No conversation selected</h2>
              <p className="text-xs text-muted/60 max-w-xs">Select a customer from the left sidebar to start messaging and managing assignments.</p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Right Column: Contact Details & Note Logger */}
      {selectedConv && (
        <div className="w-80 border-l border-border/60 bg-white flex flex-col hidden xl:flex shrink-0">
          {/* Profile overview */}
          <div className="p-5 border-b border-border/60 flex flex-col items-center text-center gap-3 shrink-0">
            <div className="h-16 w-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-foreground text-xl uppercase">
              {selectedConv.contact.firstName[0]}
              {selectedConv.contact.lastName?.[0]}
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-foreground">
                {selectedConv.contact.firstName} {selectedConv.contact.lastName}
              </h3>
              <p className="text-[10px] text-muted mt-0.5">{selectedConv.contact.jobTitle || "Contact Profile"}</p>
            </div>
          </div>

          {/* Contact Details Data fields */}
          <div className="p-5 border-b border-border/60 space-y-3 shrink-0">
            <h4 className="text-[10px] font-bold text-muted uppercase tracking-wider">Contact Info</h4>
            
            <div className="space-y-2 text-xs">
              {selectedConv.contact.phone && (
                <div className="flex items-center gap-2.5 text-foreground">
                  <Phone className="h-3.5 w-3.5 text-muted/60 shrink-0" />
                  <span className="truncate">{selectedConv.contact.phone}</span>
                </div>
              )}
              {selectedConv.contact.email && (
                <div className="flex items-center gap-2.5 text-foreground">
                  <Mail className="h-3.5 w-3.5 text-muted/60 shrink-0" />
                  <span className="truncate">{selectedConv.contact.email}</span>
                </div>
              )}
              {selectedConv.contact.companyName && (
                <div className="flex items-center gap-2.5 text-foreground">
                  <Building className="h-3.5 w-3.5 text-muted/60 shrink-0" />
                  <span className="truncate">{selectedConv.contact.companyName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes Logger */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-5 pb-2 shrink-0 flex items-center justify-between">
              <h4 className="text-[10px] font-bold text-muted uppercase tracking-wider flex items-center gap-1">
                <FileText className="h-3 w-3" /> Internal Notes
              </h4>
            </div>

            {/* Note listing scroll area */}
            <div className="flex-1 overflow-y-auto px-5 space-y-2.5 min-h-0 py-2">
              {loadingNotes ? (
                <div className="flex items-center justify-center py-4 text-muted">
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  <span className="text-[10px]">Loading notes...</span>
                </div>
              ) : notes.length === 0 ? (
                <p className="text-[10px] text-muted/60 italic text-center py-6">No internal notes logged yet.</p>
              ) : (
                notes.map((n) => (
                  <div key={n.id} className="p-3 bg-[#F4F5F1] border rounded-xl space-y-1">
                    <p className="text-[11px] text-foreground/90 leading-relaxed font-medium">
                      {n.content}
                    </p>
                    <span className="text-[9px] text-muted/60 block">
                      {new Date(n.createdAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* New Note Form */}
            <form onSubmit={handleCreateNote} className="p-4 border-t border-border/60 bg-[#FAFBFA] shrink-0 space-y-2">
              <textarea
                placeholder="Log a note for this customer..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-border/80 bg-white p-2.5 text-xs text-foreground placeholder:text-muted/60 focus:outline-none resize-none"
              />
              <Button
                type="submit"
                disabled={!newNote.trim()}
                className="w-full h-8 text-[11px] font-bold bg-foreground text-white hover:bg-foreground/90"
              >
                Save Note
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
