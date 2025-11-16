'use client'

import { useFilterStore } from '@/stores/filter-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, Filter, RefreshCw } from 'lucide-react'
import { useMemo } from 'react'

export function FilterPanel() {
  const {
    dateRange,
    windowSize,
    selectedDiseases,
    selectedSurgeries,
    ageGroups,
    selectedRegions,
    genders,
    setDateRange,
    setWindowSize,
    removeDisease,
    removeSurgery,
    toggleAgeGroup,
    toggleGender,
    removeRegion,
    resetFilters,
  } = useFilterStore()

  // 활성 필터 계산
  const activeFilters = useMemo(() => {
    const activeCount =
      (selectedDiseases.length > 0 ? 1 : 0) +
      (selectedSurgeries.length > 0 ? 1 : 0) +
      (ageGroups.length > 0 ? 1 : 0) +
      (selectedRegions.length > 0 ? 1 : 0) +
      (genders.length < 2 ? 1 : 0)

    return {
      count: activeCount,
      hasActiveFilters: activeCount > 0,
    }
  }, [selectedDiseases, selectedSurgeries, ageGroups, selectedRegions, genders])

  // 샘플 옵션 데이터
  const windowOptions = [
    { value: 30, label: '30일' },
    { value: 90, label: '90일' },
    { value: 180, label: '180일' },
  ]

  const ageGroupOptions = [
    '10대 이하',
    '20대',
    '30대',
    '40대',
    '50대',
    '60대',
    '70대 이상',
  ]

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle>필터</CardTitle>
            {activeFilters.hasActiveFilters && (
              <Badge variant="secondary">{activeFilters.count}개 적용</Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <RefreshCw className="h-4 w-4 mr-2" />
            초기화
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 기간 필터 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">기간</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(e.target.value, dateRange.end)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              />
              <span className="flex items-center">~</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(dateRange.start, e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              />
            </div>
          </div>

          {/* 윈도우 필터 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">재방문 윈도우</label>
            <Select value={String(windowSize)} onValueChange={(v) => setWindowSize(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {windowOptions.map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 연령 필터 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">연령대</label>
            <div className="flex flex-wrap gap-2">
              {ageGroupOptions.map((age) => (
                <Badge
                  key={age}
                  variant={ageGroups.includes(age) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleAgeGroup(age)}
                >
                  {age}
                </Badge>
              ))}
            </div>
          </div>

          {/* 성별 필터 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">성별</label>
            <div className="flex gap-2">
              <Badge
                variant={genders.includes('남성') ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleGender('남성')}
              >
                남성
              </Badge>
              <Badge
                variant={genders.includes('여성') ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleGender('여성')}
              >
                여성
              </Badge>
            </div>
          </div>
        </div>

        {/* 선택된 필터 표시 */}
        {(selectedDiseases.length > 0 ||
          selectedSurgeries.length > 0 ||
          selectedRegions.length > 0) && (
          <div className="space-y-2 pt-4 border-t">
            <p className="text-sm font-medium">선택된 필터</p>
            <div className="flex flex-wrap gap-2">
              {selectedDiseases.map((disease) => (
                <Badge key={disease} variant="secondary">
                  {disease}
                  <button
                    onClick={() => removeDisease(disease)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {selectedSurgeries.map((surgery) => (
                <Badge key={surgery} variant="secondary">
                  {surgery}
                  <button
                    onClick={() => removeSurgery(surgery)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {selectedRegions.map((region) => (
                <Badge key={region} variant="secondary">
                  {region}
                  <button
                    onClick={() => removeRegion(region)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

