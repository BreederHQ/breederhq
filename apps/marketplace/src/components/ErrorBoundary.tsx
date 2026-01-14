// apps/marketplace/src/components/ErrorBoundary.tsx
// Error boundary to catch rendering errors and display fallback UI

import * as React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-portal-bg flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Something went wrong</h1>
                  <p className="text-sm text-text-secondary">The application encountered an error</p>
                </div>
              </div>

              {import.meta.env.DEV && this.state.error && (
                <div className="space-y-2">
                  <div>
                    <h3 className="text-sm font-semibold text-red-400 mb-1">Error:</h3>
                    <pre className="text-xs text-red-300 bg-black/30 rounded p-3 overflow-auto">
                      {this.state.error.toString()}
                    </pre>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <h3 className="text-sm font-semibold text-red-400 mb-1">Stack Trace:</h3>
                      <pre className="text-xs text-red-300 bg-black/30 rounded p-3 overflow-auto max-h-64">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
                >
                  Reload Page
                </button>
                <button
                  type="button"
                  onClick={() => window.location.href = "/"}
                  className="px-4 py-2 rounded-lg border border-border-subtle bg-portal-card text-white text-sm font-medium hover:bg-portal-card-hover transition-colors"
                >
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
