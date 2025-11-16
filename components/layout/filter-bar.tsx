'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function FilterBar() {
  return (
    <div className="border-b bg-muted/50 px-4 py-3">
      <div className="container mx-auto">
        <div className="flex flex-wrap items-center gap-4">
          {/* 기간 선택 */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">기간:</span>
            <Input
              type="date"
              className="w-40"
              defaultValue="2024-01-01"
            />
            <span className="text-muted-foreground">~</span>
            <Input
              type="date"
              className="w-40"
              defaultValue="2024-12-31"
            />
          </div>

          {/* 윈도우 선택 */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">윈도우:</span>
            <Select defaultValue="90">
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30일</SelectItem>
                <SelectItem value="90">90일</SelectItem>
                <SelectItem value="180">180일</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 질병 필터 */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">질병:</span>
            <Select defaultValue="all">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="M179">무릎관절증</SelectItem>
                <SelectItem value="M545">요통</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 수술 필터 */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">수술:</span>
            <Select defaultValue="all">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="S80501">무릎관절경수술</SelectItem>
                <SelectItem value="S47311">백내장수술</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 연령 필터 */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">연령:</span>
            <Select defaultValue="all">
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="20">20대</SelectItem>
                <SelectItem value="30">30대</SelectItem>
                <SelectItem value="40">40대</SelectItem>
                <SelectItem value="50">50대</SelectItem>
                <SelectItem value="60">60대</SelectItem>
                <SelectItem value="70">70대+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 지역 필터 */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">지역:</span>
            <Select defaultValue="all">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="yangju">양주시</SelectItem>
                <SelectItem value="eunhyeon">은현면</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}

