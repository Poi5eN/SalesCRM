import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import { Button } from './Button.tsx';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-xl">
          <div className="h-16 w-16 rounded-3xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-6">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Something went wrong</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md mb-8">
            An unexpected error occurred while rendering this page. Our team has been notified.
          </p>
          <div className="flex items-center gap-4">
            <Button onClick={this.handleReset} variant="outline" className="rounded-2xl px-6">
              <RefreshCcw className="mr-2 h-4 w-4" /> Retry Page
            </Button>
            <Button onClick={() => window.location.href = '/'} className="rounded-2xl px-6">
              <Home className="mr-2 h-4 w-4" /> Go Home
            </Button>
          </div>
          {import.meta.env.DEV && (
            <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-left overflow-auto max-w-full">
              <pre className="text-[10px] font-mono text-red-500">{this.state.error?.stack}</pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
