import { type ReactNode } from 'react'

interface ExternalLinkProps {
  href: string
  children: ReactNode
  className?: string
}

export function ExternalLink({ href, children, className = '' }: ExternalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 hover:text-white transition-colors ${className}`}
    >
      {children}
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="shrink-0 opacity-40">
        <path
          d="M3.5 1.5H10.5V8.5M10.5 1.5L1.5 10.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  )
}
