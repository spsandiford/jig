import React from 'react';

interface State { hasError: boolean }

export class TreeErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false };
  static getDerivedStateFromError(): State {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error('TreeView crashed:', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-[#858585] text-sm">Tree view unavailable.</div>
      );
    }
    return this.props.children;
  }
}
