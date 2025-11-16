'use client'

import { Mail } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* 제작자 정보 */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>제작자:</span>
            <span className="font-semibold text-foreground">Boam79</span>
          </div>

          {/* 문의사항 */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>문의사항:</span>
            <a 
              href="mailto:ckadltmfxhrxhrxhr@gmail.com"
              className="text-primary hover:underline font-medium"
            >
              ckadltmfxhrxhrxhr@gmail.com
            </a>
          </div>

          {/* 저작권 */}
          <div className="text-xs text-muted-foreground">
            © 2024 Boam79. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}

