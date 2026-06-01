"use client";

import React, { createContext, useContext, useState } from "react";

export type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "LOST";
export type DealStage = "PROPOSAL" | "NEGOTIATION" | "CLOSED_WON" | "CLOSED_LOST";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export interface Lead {
  id: string;
  title: string;
  companyName: string;
  status: LeadStatus;
  source: string;
  value: number;
  email: string;
  phone: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  companyName: string;
}

export interface Deal {
  id: string;
  name: string;
  value: number;
  stage: DealStage;
  leadName: string;
  expectedCloseDate: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  associatedWith?: string; // Lead or Deal name
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  joinedAt: string;
}

interface CRMContextType {
  orgName: string;
  setOrgName: (name: string) => void;
  leads: Lead[];
  addLead: (lead: Omit<Lead, "id" | "createdAt">) => void;
  updateLeadStatus: (id: string, status: LeadStatus) => void;
  deleteLead: (id: string) => void;
  deals: Deal[];
  addDeal: (deal: Omit<Deal, "id">) => void;
  updateDealStage: (id: string, stage: DealStage) => void;
  deleteDeal: (id: string) => void;
  tasks: Task[];
  addTask: (task: Omit<Task, "id" | "status">) => void;
  toggleTaskStatus: (id: string) => void;
  deleteTask: (id: string) => void;
  members: Member[];
  addMember: (member: Omit<Member, "id" | "joinedAt">) => void;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orgName, setOrgName] = useState("AuraCRM Inc.");

  // Pre-seed Leads
  const [leads, setLeads] = useState<Lead[]>([
    {
      id: "lead-1",
      title: "Sarah Jenkins",
      companyName: "Acme Corp",
      status: "NEW",
      source: "Website Referral",
      value: 15000,
      email: "sarah@acme.com",
      phone: "+1 (555) 382-9182",
      createdAt: "5/31/2026",
    },
    {
      id: "lead-2",
      title: "David Miller",
      companyName: "Initech",
      status: "CONTACTED",
      source: "Cold Outreach",
      value: 22000,
      email: "d.miller@initech.co",
      phone: "+1 (555) 492-3847",
      createdAt: "5/28/2026",
    },
    {
      id: "lead-3",
      title: "Elena Rostova",
      companyName: "Globex Industries",
      status: "QUALIFIED",
      source: "Inbound Request",
      value: 48000,
      email: "elena.r@globex.org",
      phone: "+1 (555) 234-5829",
      createdAt: "5/25/2026",
    },
    {
      id: "lead-4",
      title: "Marcus Aurelius",
      companyName: "Rome Logistics",
      status: "LOST",
      source: "Conferences",
      value: 8500,
      email: "marcus@romelogistics.it",
      phone: "+39 06 1234 5678",
      createdAt: "5/21/2026",
    },
  ]);

  // Pre-seed Deals
  const [deals, setDeals] = useState<Deal[]>([
    {
      id: "deal-1",
      name: "Enterprise Cloud Subscription",
      value: 45000,
      stage: "NEGOTIATION",
      leadName: "Elena Rostova (Globex Industries)",
      expectedCloseDate: "6/16/2026",
    },
    {
      id: "deal-2",
      name: "CRM Implementation Project",
      value: 12000,
      stage: "PROPOSAL",
      leadName: "David Miller (Initech)",
      expectedCloseDate: "6/9/2026",
    },
    {
      id: "deal-3",
      name: "Developer API Access License",
      value: 25000,
      stage: "CLOSED_WON",
      leadName: "Sarah Jenkins (Acme Corp)",
      expectedCloseDate: "6/1/2026",
    },
  ]);

  // Pre-seed Tasks
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "task-1",
      title: "Follow up with Sarah on pricing proposals",
      description: "Send Acme Corp our updated tier sheets with discounts.",
      status: "TODO",
      priority: "HIGH",
      dueDate: "Due Tomorrow",
      associatedWith: "Sarah Jenkins (Acme Corp)",
    },
    {
      id: "task-2",
      title: "Deliver custom CRM SLA agreement",
      description: "Finalize negotiation document with Initech team.",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: "Due Today",
      associatedWith: "David Miller (Initech)",
    },
    {
      id: "task-3",
      title: "Schedule system kick-off call",
      description: "Introduction call with Globex account leaders.",
      status: "COMPLETED",
      priority: "LOW",
      dueDate: "Completed 3 days ago",
      associatedWith: "Elena Rostova (Globex Industries)",
    },
    {
      id: "task-4",
      title: "Investigate database sync issues",
      description: "Review sync logs for pipeline reports.",
      status: "TODO",
      priority: "HIGH",
      dueDate: "Due in 2 days",
    },
  ]);

  // Pre-seed Members
  const [members, setMembers] = useState<Member[]>([
    {
      id: "mem-1",
      name: "Alex Mercer",
      email: "alex.mercer@auracrm.com",
      role: "OWNER",
      joinedAt: "2026-01-15",
    },
    {
      id: "mem-2",
      name: "Sophia Chen",
      email: "sophia.chen@auracrm.com",
      role: "ADMIN",
      joinedAt: "2026-03-10",
    },
    {
      id: "mem-3",
      name: "Liam Nelson",
      email: "liam.nelson@auracrm.com",
      role: "MEMBER",
      joinedAt: "2026-04-22",
    },
  ]);

  // Add handlers
  const addLead = (lead: Omit<Lead, "id" | "createdAt">) => {
    const newLead: Lead = {
      ...lead,
      id: `lead-${Date.now()}`,
      createdAt: new Date().toLocaleDateString(),
    };
    setLeads((prev) => [newLead, ...prev]);
  };

  const updateLeadStatus = (id: string, status: LeadStatus) => {
    setLeads((prev) =>
      prev.map((lead) => (lead.id === id ? { ...lead, status } : lead))
    );
  };

  const deleteLead = (id: string) => {
    setLeads((prev) => prev.filter((lead) => lead.id !== id));
  };

  const addDeal = (deal: Omit<Deal, "id">) => {
    const newDeal: Deal = {
      ...deal,
      id: `deal-${Date.now()}`,
    };
    setDeals((prev) => [newDeal, ...prev]);
  };

  const updateDealStage = (id: string, stage: DealStage) => {
    setDeals((prev) =>
      prev.map((deal) => (deal.id === id ? { ...deal, stage } : deal))
    );
  };

  const deleteDeal = (id: string) => {
    setDeals((prev) => prev.filter((deal) => deal.id !== id));
  };

  const addTask = (task: Omit<Task, "id" | "status">) => {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      status: "TODO",
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const toggleTaskStatus = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              status: task.status === "COMPLETED" ? "TODO" : "COMPLETED",
              dueDate: task.status === "COMPLETED" ? "Due in 2 days" : "Completed just now",
            }
          : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const addMember = (member: Omit<Member, "id" | "joinedAt">) => {
    const newMember: Member = {
      ...member,
      id: `mem-${Date.now()}`,
      joinedAt: new Date().toISOString().split("T")[0],
    };
    setMembers((prev) => [...prev, newMember]);
  };

  return (
    <CRMContext.Provider
      value={{
        orgName,
        setOrgName,
        leads,
        addLead,
        updateLeadStatus,
        deleteLead,
        deals,
        addDeal,
        updateDealStage,
        deleteDeal,
        tasks,
        addTask,
        toggleTaskStatus,
        deleteTask,
        members,
        addMember,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error("useCRM must be used within a CRMProvider");
  }
  return context;
};
