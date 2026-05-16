'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  componentName?: string;
  lang?: 'id' | 'en';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.componentName}]`, error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      const isEn = this.props.lang === 'en';
      const failedMsg = this.props.componentName
        ? (isEn ? `${this.props.componentName} failed to load` : `${this.props.componentName} gagal dimuat`)
        : (isEn ? 'Component failed to load' : 'Komponen gagal dimuat');
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-2xl border border-gray-200 text-center gap-3">
          <span className="text-3xl">⚠️</span>
          <p className="font-semibold text-gray-700">{failedMsg}</p>
          <p className="text-sm text-gray-500">{isEn ? 'Try refreshing the page' : 'Coba refresh halaman'}</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="text-sm px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
          >
            {isEn ? 'Try Again' : 'Coba Lagi'}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
