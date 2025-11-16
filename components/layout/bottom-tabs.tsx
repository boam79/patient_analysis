'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function BottomTabs() {
  return (
    <div className="container mx-auto px-4 py-6">
      <Card>
        <CardHeader>
          <Tabs defaultValue="trend" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="trend">Trend</TabsTrigger>
              <TabsTrigger value="boundary">Boundary</TabsTrigger>
              <TabsTrigger value="table">Table</TabsTrigger>
              <TabsTrigger value="surgery">Surgery</TabsTrigger>
            </TabsList>

            <TabsContent value="trend" className="mt-6">
              <CardTitle className="text-lg mb-4">기간별 추세</CardTitle>
              <div className="space-y-4">
                <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">
                    월별 재방문율 라인 차트
                  </p>
                </div>
                <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">
                    신규 vs 재방문 환자수 막대 차트
                  </p>
                </div>
                <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">
                    요일별 수술 히트맵
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="boundary" className="mt-6">
              <CardTitle className="text-lg mb-4">지역 비교</CardTitle>
              <div className="space-y-4">
                <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">
                    지역별 재방문율 막대 차트
                  </p>
                </div>
                <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">
                    지역별 환자 분포 Boxplot
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="table" className="mt-6">
              <CardTitle className="text-lg mb-4">데이터 표</CardTitle>
              <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">
                  질병|연령대|환자수|재방문율|지역|평균간격 테이블
                </p>
              </div>
            </TabsContent>

            <TabsContent value="surgery" className="mt-6">
              <CardTitle className="text-lg mb-4">수술 상세 분석</CardTitle>
              <div className="space-y-4">
                <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">
                    수술-질병 연관 매트릭스
                  </p>
                </div>
                <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">
                    수술 후 재방문 타임라인
                  </p>
                </div>
                <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">
                    재원일수 vs 재방문율 산점도
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardHeader>
        <CardContent>
          {/* 탭 컨텐츠는 TabsContent에 포함됨 */}
        </CardContent>
      </Card>
    </div>
  )
}

