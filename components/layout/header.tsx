'use client'

import { Button } from '@/components/ui/button'
import { Upload, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useDataStore } from '@/stores/data-store'
import { useFilterStore } from '@/stores/filter-store'

export function Header() {
  const router = useRouter()
  const { resetData, isDataLoaded, totalPatients } = useDataStore()
  const { resetFilters } = useFilterStore()

  const handleReset = () => {
    // 데이터 및 필터 초기화
    resetData()
    resetFilters()
    // 업로드 페이지로 이동
    router.push('/dashboard/upload')
  }

  const handleUpload = () => {
    router.push('/dashboard/upload')
  }

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-4">
        {/* 로고 및 네비게이션 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer group"
            >
              <h1 className="text-2xl font-bold">환자 데이터 분석툴</h1>
              <RefreshCw className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <span className="text-sm text-muted-foreground">v4.1</span>
            {isDataLoaded && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                {totalPatients.toLocaleString()}명 로드됨
              </span>
            )}
          </div>
            <nav className="flex items-center gap-4 ml-8">
              <a 
                href="/dashboard" 
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                대시보드
              </a>
              <a 
                href="/dashboard/map" 
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                🗺️ 지도 분석
              </a>
              <a 
                href="/dashboard/charts" 
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                📊 차트 분석
              </a>
              <a 
                href="/dashboard/strategy" 
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                📈 전략 분석
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="default" size="sm" onClick={handleUpload}>
              <Upload className="mr-2 h-4 w-4" />
              데이터 업로드
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

