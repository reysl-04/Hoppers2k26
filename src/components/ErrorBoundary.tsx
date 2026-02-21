import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-zinc-950 text-zinc-100">
          <h1 className="text-xl font-bold text-red-400 mb-2">Something went wrong</h1>
          <p className="text-zinc-400 text-sm text-center mb-4">
            {this.state.error?.message ?? 'An unexpected error occurred'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium"
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
