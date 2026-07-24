'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { HelpCircle } from 'lucide-react'

const TERMS = [
  {
    term: '윈도우 재방문율',
    def: '고유 환자 중, 인접 방문 간격이 N일 이하인 재방문이 한 번이라도 있는 비율. KPI·지도·경영 인사이트의 기본 정의.',
  },
  {
    term: '다회 방문 비율',
    def: '방문 횟수가 2회 이상인 환자 비율. 간격·윈도우와 무관.',
  },
  {
    term: '생애재방문(월별)',
    def: '해당 월에 방문한 환자 중, 데이터상 첫 방문이 그 달보다 이전인 환자 비중. 윈도우를 쓰지 않음.',
  },
  {
    term: '업로드 요약 KPI',
    def: '헤더에 보이는 환자 수·재방문율은 업로드(또는 샘플) 처리 시점 요약이며, 기본 윈도우는 처리 시 지정값(보통 90일). 대시보드 필터 윈도우와 다를 수 있음.',
  },
]

/** 지표 정의 glossary — 대시보드/전략 공통 */
export function MetricGlossary() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="gap-1 text-muted-foreground">
          <HelpCircle className="h-3.5 w-3.5" />
          지표 정의
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">지표 정의</DialogTitle>
          <DialogDescription>
            같은 「재방문」이라도 화면마다 정의가 다릅니다. 아래를 기준으로 해석하세요.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-3 text-sm">
          {TERMS.map((t) => (
            <li key={t.term} className="border-b border-border/60 pb-2 last:border-0">
              <p className="font-medium text-brand-ink">{t.term}</p>
              <p className="mt-0.5 text-muted-foreground">{t.def}</p>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
