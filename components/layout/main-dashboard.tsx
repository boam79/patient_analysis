'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function MainDashboard() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-12 gap-6">
        {/* 좌측 패널 (280px) */}
        <div className="col-span-3">
          <Card className="h-full">
            <CardHeader>
              <Tabs defaultValue="disease" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="disease">질병</TabsTrigger>
                  <TabsTrigger value="surgery">수술</TabsTrigger>
                </TabsList>
                <TabsContent value="disease" className="mt-4">
                  <CardTitle className="text-lg mb-4">질병 Top 10</CardTitle>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      막대 그래프 영역
                    </div>
                    <div className="text-sm text-muted-foreground">
                      연령 피라미드 영역
                    </div>
                    <div className="text-sm text-muted-foreground">
                      이탈 질병 리스트 영역
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="surgery" className="mt-4">
                  <CardTitle className="text-lg mb-4">수술 Top 20</CardTitle>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      수술 막대 그래프 영역
                    </div>
                    <div className="text-sm text-muted-foreground">
                      수술 카테고리 파이 차트 영역
                    </div>
                    <div className="text-sm text-muted-foreground">
                      급증/급감 수술 리스트 영역
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardHeader>
            <CardContent>
              {/* 차트 컴포넌트들이 여기에 들어갑니다 */}
            </CardContent>
          </Card>
        </div>

        {/* 중앙 패널 (가변) - 지도 */}
        <div className="col-span-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>지도 히트맵</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[600px] bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <p className="text-lg font-medium mb-2">지도 영역</p>
                  <p className="text-sm">
                    Leaflet.js + OpenStreetMap 히트맵이 여기에 표시됩니다
                  </p>
                  <div className="mt-4 flex gap-2 justify-center">
                    <button className="px-3 py-1 text-xs bg-background border rounded">
                      밀집도
                    </button>
                    <button className="px-3 py-1 text-xs bg-background border rounded">
                      재방문율
                    </button>
                    <button className="px-3 py-1 text-xs bg-background border rounded">
                      수술량
                    </button>
                    <button className="px-3 py-1 text-xs bg-background border rounded">
                      듀얼
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 우측 패널 (320px) */}
        <div className="col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>선택 지역 상세</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                지역을 선택하면 상세 정보가 표시됩니다
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">KPI 지표 (6개)</div>
                <div className="text-sm text-muted-foreground">
                  해당 지역 Top 3 수술
                </div>
                <div className="text-sm text-muted-foreground">
                  주요 연령대 차트
                </div>
                <div className="text-sm text-muted-foreground">
                  자동 인사이트 문장
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

