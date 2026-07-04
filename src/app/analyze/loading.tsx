import { Brain } from "lucide-react";

export default function AnalyzeLoading() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/15">
          <Brain className="h-7 w-7 text-primary animate-pulse" />
        </div>
        <h2 className="text-lg font-semibold text-text-primary">
          Loading MeetMind
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Preparing the analysis dashboard...
        </p>
      </div>
    </div>
  );
}
