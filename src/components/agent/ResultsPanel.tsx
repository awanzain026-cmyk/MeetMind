"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  FileText,
  CheckSquare,
  Mail,
  ListTodo,
  Copy,
  Check,
  ExternalLink,
  Pencil,
  ArrowUpDown,
  Calendar,
  User,
  Clock,
  Target,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MeetingAnalysis, ActionItem, Task } from "@/lib/types";
import { Button } from "@/components/ui/Button";

type TabId = "summary" | "action-items" | "email" | "tasks";

interface ResultsPanelProps {
  analysis: MeetingAnalysis;
}

const tabs: { id: TabId; label: string; icon: typeof FileText }[] = [
  { id: "summary", label: "Summary", icon: FileText },
  { id: "action-items", label: "Action Items", icon: CheckSquare },
  { id: "email", label: "Follow-up Email", icon: Mail },
  { id: "tasks", label: "Tasks", icon: ListTodo },
];

function SentimentMeter({ sentiment }: { sentiment: string }) {
  const score = (() => {
    const lower = sentiment.toLowerCase();
    if (lower.includes("negative") || lower.includes("tense")) return 20;
    if (lower.includes("neutral") || lower.includes("balanced")) return 50;
    if (lower.includes("positive") || lower.includes("enthusiastic")) return 80;
    if (lower.includes("very positive") || lower.includes("highly")) return 95;
    return 50;
  })();

  const color =
    score < 35
      ? "#ef4444"
      : score < 60
        ? "#f59e0b"
        : "#10b981";

  return (
    <div className="rounded-xl bg-surface2 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-text-primary">
          Sentiment Score
        </span>
        <span className="text-sm font-bold" style={{ color }}>
          {score}%
        </span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-surface">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          className="h-full rounded-full transition-colors"
          style={{ backgroundColor: color }}
        />
      </div>
      <p className="mt-2 text-xs text-text-muted capitalize">
        {sentiment}
      </p>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: "high" | "medium" | "low" }) {
  const styles = {
    high: "bg-error/15 text-error border-error/20",
    medium: "bg-warning/15 text-warning border-warning/20",
    low: "bg-text-dim/15 text-text-muted border-text-dim/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase",
        styles[priority],
      )}
    >
      {priority}
    </span>
  );
}

export default function ResultsPanel({ analysis }: ResultsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("summary");
  const [priorityFilter, setPriorityFilter] = useState<
    "all" | "high" | "medium" | "low"
  >("all");
  const [sortBy, setSortBy] = useState<"priority" | "deadline">("priority");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [emailBody, setEmailBody] = useState(analysis.followUpEmail);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  const filteredItems = useMemo(() => {
    let items = [...analysis.actionItems];
    if (priorityFilter !== "all") {
      items = items.filter((i) => i.priority === priorityFilter);
    }
    items.sort((a, b) => {
      if (sortBy === "priority") {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.priority] - order[b.priority];
      }
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
    return items;
  }, [analysis.actionItems, priorityFilter, sortBy]);

  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, Task[]> = {
      todo: [],
      "in-progress": [],
      done: [],
    };
    for (const t of analysis.tasks) {
      const key = t.status.toLowerCase().replace(/\s+/g, "-");
      if (grouped[key]) grouped[key].push(t);
      else grouped["todo"].push(t);
    }
    return grouped;
  }, [analysis.tasks]);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex gap-1 rounded-xl bg-surface2 p-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "relative flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap",
                isActive
                  ? "text-text-primary"
                  : "text-text-muted hover:text-text-primary",
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="tab-bg"
                  className="absolute inset-0 rounded-lg bg-surface"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="relative z-10 h-3.5 w-3.5" />
              <span className="relative z-10">{tab.label}</span>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "summary" && (
            <SummaryTab analysis={analysis} />
          )}
          {activeTab === "action-items" && (
            <ActionItemsTab
              items={filteredItems}
              priorityFilter={priorityFilter}
              setPriorityFilter={setPriorityFilter}
              sortBy={sortBy}
              setSortBy={setSortBy}
              copiedId={copiedId}
              handleCopy={handleCopy}
              total={analysis.actionItems.length}
            />
          )}
          {activeTab === "email" && (
            <EmailTab
              editMode={editMode}
              setEditMode={setEditMode}
              emailBody={emailBody}
              setEmailBody={setEmailBody}
              copiedId={copiedId}
              handleCopy={handleCopy}
            />
          )}
          {activeTab === "tasks" && (
            <TasksTab
              tasksByStatus={tasksByStatus}
              completedTasks={completedTasks}
              setCompletedTasks={setCompletedTasks}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function SummaryTab({ analysis }: { analysis: MeetingAnalysis }) {
  const wordCount = analysis.summary.split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-text-primary">
          Meeting Summary
        </h3>
        <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            ~{readTime} min read
          </span>
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {wordCount} words
          </span>
        </div>
      </div>

      <SentimentMeter sentiment={analysis.sentiment} />

      {analysis.summary ? (
        <div className="rounded-xl bg-surface2 p-4">
          <p className="text-sm leading-relaxed text-text-primary whitespace-pre-wrap">
            {analysis.summary}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-text-muted">
          <FileText className="mb-3 h-10 w-10 opacity-30" />
          <p className="text-sm">No summary generated</p>
        </div>
      )}

      {analysis.decisions.length > 0 && (
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Target className="h-4 w-4 text-primary" />
            Key Decisions
          </h4>
          <div className="space-y-2">
            {analysis.decisions.map((decision, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3"
              >
                <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary/15">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                <p className="text-sm text-text-primary">{decision}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionItemsTab({
  items,
  priorityFilter,
  setPriorityFilter,
  sortBy,
  setSortBy,
  copiedId,
  handleCopy,
  total,
}: {
  items: ActionItem[];
  priorityFilter: string;
  setPriorityFilter: (v: "all" | "high" | "medium" | "low") => void;
  sortBy: string;
  setSortBy: (v: "priority" | "deadline") => void;
  copiedId: string | null;
  handleCopy: (text: string, id: string) => void;
  total: number;
}) {
  const allText = items
    .map((i) => `- [ ] ${i.task} (${i.owner}, ${i.priority})`)
    .join("\n");

  const filters = ["all", "high", "medium", "low"] as const;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg bg-surface2 p-1">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setPriorityFilter(f)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                priorityFilter === f
                  ? "bg-surface text-text-primary"
                  : "text-text-muted hover:text-text-primary",
              )}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setSortBy(sortBy === "priority" ? "deadline" : "priority")
            }
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            <ArrowUpDown className="h-3 w-3" />
            {sortBy === "priority" ? "Priority" : "Deadline"}
          </button>

          {total > 0 && (
            <Button
              variant="ghost"
              className="text-xs"
              onClick={() => handleCopy(allText, "all-actions")}
            >
              {copiedId === "all-actions" ? (
                <>
                  <Check className="h-3 w-3" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> Copy All
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {total > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-surface2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${(items.filter((i) => i.priority === "high").length / total) * 100}%`,
              }}
              className="h-full rounded-full bg-error"
            />
          </div>
          <span className="text-[10px] text-text-muted">
            {items.filter((i) => i.priority === "high").length} high priority
          </span>
        </div>
      )}

      <LayoutGroup>
        <div className="space-y-2">
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3"
            >
              <div className="mt-0.5 flex h-4 w-4 items-center justify-center rounded border border-text-dim/30">
                <div className="h-2 w-2 rounded-sm bg-text-dim/20" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary">{item.task}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1 text-[10px] text-text-muted">
                    <User className="h-3 w-3" />
                    {item.owner}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-text-muted">
                    <Calendar className="h-3 w-3" />
                    {new Date(item.deadline).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <PriorityBadge priority={item.priority} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </LayoutGroup>

      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-text-muted">
          <CheckSquare className="mb-3 h-8 w-8 opacity-40" />
          <p className="text-sm">No action items found</p>
        </div>
      )}
    </div>
  );
}

function EmailTab({
  editMode,
  setEditMode,
  emailBody,
  setEmailBody,
  copiedId,
  handleCopy,
}: {
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  emailBody: string;
  setEmailBody: (v: string) => void;
  copiedId: string | null;
  handleCopy: (text: string, id: string) => void;
}) {
  const subjectLine = "Meeting Follow-up: Key Decisions & Next Steps";

  const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subjectLine)}&body=${encodeURIComponent(emailBody)}`;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">
          Email Preview
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditMode(!editMode)}
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors cursor-pointer",
              editMode
                ? "bg-primary/15 text-primary"
                : "text-text-muted hover:text-text-primary",
            )}
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>
          <Button
            variant="ghost"
            className="text-xs"
            onClick={() => handleCopy(emailBody, "email-body")}
          >
            {copiedId === "email-body" ? (
              <>
                <Check className="h-3 w-3" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" /> Copy
              </>
            )}
          </Button>
          <a
            href={gmailLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-md bg-primary/15 px-2 py-1 text-xs text-primary hover:bg-primary/25 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Open in Gmail
          </a>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="border-b border-border bg-surface2 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span className="font-medium text-text-primary">To:</span>
            team@company.com
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted mt-1">
            <span className="font-medium text-text-primary">Subject:</span>
            {subjectLine}
          </div>
        </div>

        <div className="p-4">
          {editMode ? (
            <textarea
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              className="min-h-[200px] w-full resize-y rounded-lg bg-surface2 p-3 text-sm text-text-primary outline-none ring-1 ring-border focus:ring-primary/50"
            />
          ) : (
            <p className="text-sm leading-relaxed text-text-primary whitespace-pre-wrap">
              {emailBody}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function TasksTab({
  tasksByStatus,
  completedTasks,
  setCompletedTasks,
}: {
  tasksByStatus: Record<string, Task[]>;
  completedTasks: Set<string>;
  setCompletedTasks: (v: Set<string>) => void;
}) {
  const columns = [
    { key: "todo", label: "To Do", icon: Clock, color: "text-text-muted" },
    {
      key: "in-progress",
      label: "In Progress",
      icon: AlertCircle,
      color: "text-primary",
    },
    { key: "done", label: "Done", icon: Check, color: "text-success" },
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {columns.map((col) => {
        const Icon = col.icon;
        const tasks = tasksByStatus[col.key] ?? [];
        return (
          <div
            key={col.key}
            className="rounded-xl border border-border bg-surface/50"
          >
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Icon className={cn("h-3.5 w-3.5", col.color)} />
                <span className="text-xs font-medium text-text-primary">
                  {col.label}
                </span>
              </div>
              <span className="text-xs text-text-muted">{tasks.length}</span>
            </div>

            <div className="space-y-2 p-3">
              {tasks.map((task) => {
                const isCompleted = completedTasks.has(task.id);
                const initials = task.assignee
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -2 }}
                    className={cn(
                      "rounded-lg border border-border bg-surface p-3 transition-all duration-200 cursor-default",
                      isCompleted && "opacity-60",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <button
                        onClick={() => {
                          const next = new Set(completedTasks);
                          if (isCompleted) next.delete(task.id);
                          else next.add(task.id);
                          setCompletedTasks(next);
                        }}
                        className={cn(
                          "mt-0.5 flex h-4 w-4 items-center justify-center rounded border transition-colors cursor-pointer",
                          isCompleted
                            ? "border-success bg-success text-white"
                            : "border-text-dim/30 hover:border-primary/50",
                        )}
                      >
                        {isCompleted && <Check className="h-3 w-3" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-sm",
                            isCompleted
                              ? "text-text-muted line-through"
                              : "text-text-primary",
                          )}
                        >
                          {task.title}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[9px] font-semibold text-primary">
                            {initials}
                          </div>
                          <span className="text-[10px] text-text-muted">
                            {task.assignee}
                          </span>
                          {task.dueDate && (
                            <span className="flex items-center gap-1 text-[10px] text-text-dim">
                              <Calendar className="h-2.5 w-2.5" />
                              {new Date(task.dueDate).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric" },
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {tasks.length === 0 && (
                <div className="py-6 text-center">
                  <p className="text-xs text-text-dim">No tasks</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
