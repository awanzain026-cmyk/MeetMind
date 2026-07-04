export interface Agent {
  id: string;
  name: string;
  role: string;
  status: "idle" | "running" | "done" | "error";
  output?: string;
  duration?: number;
}

export interface MeetingAnalysis {
  transcript: string;
  summary: string;
  actionItems: ActionItem[];
  decisions: string[];
  sentiment: string;
  followUpEmail: string;
  tasks: Task[];
  agents: Agent[];
}

export interface ActionItem {
  id: string;
  task: string;
  owner: string;
  deadline: string;
  priority: "high" | "medium" | "low";
}

export interface Task {
  id: string;
  title: string;
  assignee: string;
  dueDate: string;
  status: string;
}
