export const SAMPLE_TRANSCRIPT = `Meeting: Q3 Product Roadmap Planning
Date: March 15, 2024
Attendees: Sarah Chen (PM), Mike Torres (Eng), Lisa Park (Design), James Wilson (Marketing)

Sarah: Let's start with the Q3 roadmap. We need to finalize priorities by end of week.
Mike: The team has bandwidth for 2 major features. I'd recommend focusing on the analytics dashboard and the notification system.
Lisa: From a design perspective, the analytics dashboard has more UX debt. We should prioritize that.
Sarah: Agreed. Let's make the analytics dashboard our top priority.
Mike: I'll need 3 engineers for 6 weeks. We can start mid-April.
Sarah: Great. Also, we need to discuss the customer feedback about the mobile app performance.
James: Marketing has been hearing complaints about load times on Android.
Mike: We can allocate one engineer to optimize performance in parallel.
Sarah: Perfect. James, can you prepare a customer communication about the upcoming improvements?
James: Sure, I'll draft something by Friday.
Sarah: Let's schedule a follow-up for next Monday to review the engineering plan.
Mike: Works for me. I'll have the detailed breakdown ready by then.
Lisa: I'll have the design explorations done by Thursday for review.
Sarah: Excellent. Let's also talk about the budget. We have $50k remaining for Q3.
Mike: The analytics dashboard will cost about $30k in engineering time.
Lisa: Design resources will be around $5k for user research and prototyping.
James: Marketing can allocate $10k for the launch campaign.
Sarah: That leaves us $5k buffer. Good. One more thing — the executive team wants a decision on the new collaboration feature.
Mike: That would require at least 2 more engineers. We don't have the headcount.
Sarah: Let's push that to Q4 planning then. Mike, include that in your roadmap proposal.
Mike: Will do. I'll also include the performance optimization work.
James: Should I mention the mobile improvements in the customer newsletter?
Sarah: Yes, but frame it as "coming soon" rather than promising dates.
Lisa: I can create some mockups for the newsletter visuals.
James: That would be great, Lisa. Let's sync on Thursday after your design review.
Sarah: Okay, I think we have a solid plan. Let me summarize the action items:
1. Mike — Detailed engineering plan for analytics dashboard by Monday
2. Lisa — Design explorations for analytics dashboard by Thursday
3. James — Customer communication draft about improvements by Friday
4. Mike — Include performance optimization in roadmap
5. Mike — Add collaboration feature to Q4 proposal
6. Lisa — Create newsletter visuals for James
7. Sarah — Schedule follow-up meeting for Monday
Any questions? No? Great work everyone.`;

export interface AgentDefinition {
  id: string;
  name: string;
  role: string;
  description: string;
  icon: string;
  color: string;
}

export const AGENTS: AgentDefinition[] = [
  {
    id: "transcript-processor",
    name: "Transcript Processor Agent",
    role: "Processes raw meeting transcripts into structured, clean text",
    description:
      "Cleans and structures raw meeting transcripts, removing filler words, identifying speakers, and creating a timestamped dialogue stream.",
    icon: "FileText",
    color: "#6366f1",
  },
  {
    id: "action-item-extractor",
    name: "Action Item Extractor Agent",
    role: "Identifies and extracts action items, owners, and deadlines",
    description:
      "Parses the structured transcript to identify commitments, tasks, deadlines, and assigned owners, outputting a ranked list of action items.",
    icon: "CheckSquare",
    color: "#10b981",
  },
  {
    id: "sentiment-analyzer",
    name: "Sentiment & Tone Analyzer Agent",
    role: "Analyzes emotional tone, sentiment shifts, and engagement levels",
    description:
      "Analyzes the conversation for sentiment trends, detects tension or enthusiasm, and provides a tone heatmap across the meeting timeline.",
    icon: "Activity",
    color: "#f59e0b",
  },
  {
    id: "summary-writer",
    name: "Meeting Summary Writer Agent",
    role: "Generates concise, structured meeting summaries",
    description:
      "Synthesizes the transcript, action items, and sentiment data into a concise, well-structured executive summary with key decisions highlighted.",
    icon: "FileText",
    color: "#8b5cf6",
  },
  {
    id: "followup-email",
    name: "Follow-up Email Generator Agent",
    role: "Drafts professional follow-up emails based on meeting outcomes",
    description:
      "Creates a polished follow-up email summarizing key decisions, action items, and next steps, ready to send to all participants.",
    icon: "Send",
    color: "#06b6d4",
  },
];
