'use client'

import { Mail } from 'lucide-react'
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/70 bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-5 md:flex-row">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Link href="/" className="font-display font-semibold text-brand hover:opacity-80">
            병원 CRM
          </Link>
          <span className="text-border">|</span>
          <span>
            제작자 <span className="font-medium text-foreground">Boam79</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-3.5 w-3.5" />
          <a
            href="mailto:ckadltmfxhrxhrxhr@gmail.com"
            className="font-medium text-brand hover:underline"
          >
            ckadltmfxhrxhrxhr@gmail.com
          </a>
        </div>

        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Boam79
        </p>
      </div>
    </footer>
  )
}
