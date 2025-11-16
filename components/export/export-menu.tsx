'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileText, Image, FileSpreadsheet, Loader2 } from 'lucide-react'
import { exportToCSV, captureElementToPNG, generatePDFReport } from '@/lib/export-utils'
import { useFilterStore } from '@/stores/filter-store'
import { useToast } from '@/hooks/use-toast'

interface ExportMenuProps {
  data?: any[]
  chartIds?: string[]
}

export function ExportMenu({ data, chartIds }: ExportMenuProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { dateRange, selectedDiseases, selectedRegions } = useFilterStore()
  const { toast } = useToast()

  const handleCSVExport = () => {
    if (!data || data.length === 0) {
      toast({
        title: '데이터 없음',
        description: '내보낼 데이터가 없습니다.',
        variant: 'destructive',
      })
      return
    }

    const result = exportToCSV(data, `pdr_data_${Date.now()}.csv`)
    
    if (result.success) {
      toast({
        title: '성공',
        description: result.message,
      })
    } else {
      toast({
        title: '실패',
        description: result.message,
        variant: 'destructive',
      })
    }
  }

  const handlePNGExport = async (elementId: string, name: string) => {
    setIsExporting(true)
    
    const result = await captureElementToPNG(
      elementId,
      `${name}_${Date.now()}.png`,
      { scale: 2, backgroundColor: '#ffffff' }
    )

    if (result.success) {
      toast({
        title: '성공',
        description: result.message,
      })
    } else {
      toast({
        title: '실패',
        description: result.message,
        variant: 'destructive',
      })
    }

    setIsExporting(false)
  }

  const handlePDFReport = async () => {
    setIsExporting(true)

    // 활성 필터 수집
    const activeFilters: string[] = []
    if (selectedDiseases.length > 0) {
      activeFilters.push(`질병: ${selectedDiseases.join(', ')}`)
    }
    if (selectedRegions.length > 0) {
      activeFilters.push(`지역: ${selectedRegions.join(', ')}`)
    }

    const result = await generatePDFReport({
      title: 'PDR Dashboard 분석 보고서',
      subtitle: '환자 데이터 재방문 분석',
      filename: `pdr_report_${Date.now()}.pdf`,
      includeMetadata: {
        dateRange: `${dateRange.start} ~ ${dateRange.end}`,
        filters: activeFilters.length > 0 ? activeFilters : ['필터 없음'],
        generatedAt: new Date().toLocaleString('ko-KR'),
      },
      sections: [
        {
          title: '1. 요약 통계',
          text: '이 보고서는 선택한 기간 동안의 환자 재방문 패턴을 분석한 결과입니다.',
        },
        {
          title: '2. 질병 분포',
          elementId: 'disease-chart',
        },
        {
          title: '3. 연령 분포',
          elementId: 'age-pyramid-chart',
        },
        {
          title: '4. 공간 분석',
          elementId: 'map-container',
        },
      ],
    })

    if (result.success) {
      toast({
        title: '성공',
        description: result.message,
      })
    } else {
      toast({
        title: '실패',
        description: result.message,
        variant: 'destructive',
      })
    }

    setIsExporting(false)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              내보내는 중...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              내보내기
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>내보내기 형식 선택</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleCSVExport} disabled={!data || data.length === 0}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          <span>CSV 파일</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handlePNGExport('dashboard-main', 'dashboard')}>
          <Image className="mr-2 h-4 w-4" />
          <span>PNG 이미지 (대시보드)</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handlePDFReport}>
          <FileText className="mr-2 h-4 w-4" />
          <span>PDF 보고서 (종합)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

