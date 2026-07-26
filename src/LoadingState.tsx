type LoadingStateProps = {
  className?: string
}

export default function LoadingState({ className = '' }: LoadingStateProps) {
  return (
    <div className={`loading-state ${className}`.trim()} role="status" aria-live="polite">
      <img src="/logo.png" alt="" className="loading-logo" />
      <p className="loading-text">Mulk Ecosystem...</p>
    </div>
  )
}
