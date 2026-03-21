import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Optional panel title for contextual error message */
  title?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Caught render error:', error, info.componentStack)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-[#161622] border border-[#EF444420] rounded-xl p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] flex-shrink-0" />
            <h3 className="text-sm font-semibold text-white">{this.props.title ?? 'Panel'}</h3>
          </div>
          <div className="rounded-lg bg-[#EF444408] border border-[#EF444415] px-3 py-2.5">
            <p className="text-sm text-red-400 leading-relaxed">This panel encountered an error</p>
            {this.state.error?.message && (
              <p className="text-xs text-gray-500 mt-1 leading-relaxed font-mono">
                {this.state.error.message}
              </p>
            )}
          </div>
          <button
            onClick={this.handleRetry}
            className="self-start text-xs px-3 py-1.5 bg-[#111118] hover:bg-[#1E1E2E] text-gray-300 rounded-md transition-colors border border-[#252535]"
          >
            Retry
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
