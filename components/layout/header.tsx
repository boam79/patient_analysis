'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Camera, Settings } from 'lucide-react'

export function Header() {
  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-4">
        {/* 로고 및 네비게이션 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-6">
            <a href="/dashboard" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
              <h1 className="text-2xl font-bold">PDR Dashboard v4.1</h1>
              <span className="text-sm text-muted-foreground">
                환자 데이터 분석 대시보드
              </span>
            </a>
            <nav className="flex items-center gap-4 ml-8">
              <a 
                href="/dashboard" 
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                대시보드
              </a>
              <a 
                href="/dashboard/upload" 
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                📤 데이터 업로드
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
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              보고서
            </Button>
            <Button variant="outline" size="sm">
              <Camera className="mr-2 h-4 w-4" />
              캡처
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              설정
            </Button>
          </div>
        </div>

        {/* KPI 카드 영역 (6개) */}
        <div className="grid grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                환자수
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-positive mt-1">↑8.3%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                재방문율
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45.2%</div>
              <p className="text-xs text-positive mt-1">↑7.2pp</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                평균 간격
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">28일</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                총 수술 건수
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">187건</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                주요 수술
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate">무릎관절경...</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                평균 재원일수
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3.2일</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </header>
  )
}

