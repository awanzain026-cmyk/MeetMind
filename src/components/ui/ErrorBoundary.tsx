"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[60vh] items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-error/15">
              <AlertTriangle className="h-8 w-8 text-error" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-text-primary">
              Something went wrong
            </h2>
            <p className="mb-2 text-sm text-text-muted">
              {this.state.error?.message ?? "An unexpected error occurred."}
            </p>
            <p className="mb-8 text-xs text-text-dim">
              Please try again or go back to the homepage.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button onClick={this.handleRetry} className="gap-2">
                <RotateCcw className="h-4 w-4" /> Try Again
              </Button>
              <Link href="/">
                <Button variant="ghost" className="gap-2">
                  <Home className="h-4 w-4" /> Back Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
