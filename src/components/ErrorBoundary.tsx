import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[hadi-canvas]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#0b1220] p-6 text-slate-100" dir="rtl">
          <div className="max-w-md rounded-2xl border border-red-900/50 bg-slate-900/80 p-6">
            <h1 className="mb-2 text-lg font-semibold text-red-300">خطای رابط کاربری</h1>
            <p className="mb-3 text-xs text-slate-400">
              یک بخش از برنامه متوقف شد. می‌توانید صفحه را تازه کنید؛ داده‌های localStorage معمولاً حفظ می‌شوند.
            </p>
            <pre className="mb-4 max-h-32 overflow-auto rounded-lg bg-black/40 p-2 text-[10px] text-red-200">
              {this.state.error.message}
            </pre>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-xl bg-violet-600 px-3 py-2 text-xs text-white"
                onClick={() => this.setState({ error: null })}
              >
                تلاش مجدد
              </button>
              <button
                type="button"
                className="rounded-xl bg-slate-800 px-3 py-2 text-xs text-slate-200"
                onClick={() => window.location.reload()}
              >
                بارگذاری مجدد صفحه
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
