import React from 'react';
import { AuthProvider } from './context/AuthContext';
import Routes from './routes/Routes';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary caught]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-8 font-sans">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-red-200 dark:border-red-900/40 shadow-xl p-8 text-center space-y-4">
            <div className="text-5xl">⚠️</div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Something went wrong</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{this.state.error?.message || 'An unexpected error occurred.'}</p>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }}
              className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Routes />
      </AuthProvider>
    </ErrorBoundary>
  );
}
