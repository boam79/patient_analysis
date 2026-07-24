'use client'

import { useMemo, useState } from 'react'
import { Filter, Plus, X, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFilterStore } from '@/stores/filter-store'
import { buildFilterChips } from '@/lib/utils/filter-chips'
import { FilterPanel } from '@/components/filter/filter-panel'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

interface FilterChipBarProps {
  className?: string
  sticky?: boolean
}

export function FilterChipBar({ className, sticky = true }: FilterChipBarProps) {
  const [open, setOpen] = useState(false)
  const {
    dateRange,
    windowSize,
    selectedDiseases,
    selectedSurgeries,
    selectedRegions,
    ageGroups,
    genders,
    setDateRange,
    setWindowSize,
    removeDisease,
    removeSurgery,
    removeRegion,
    toggleAgeGroup,
    toggleGender,
    resetFilters,
  } = useFilterStore()

  const chips = useMemo(
    () =>
      buildFilterChips({
        dateRange,
        windowSize,
        selectedDiseases,
        selectedSurgeries,
        selectedRegions,
        ageGroups,
        genders,
      }),
    [
      dateRange,
      windowSize,
      selectedDiseases,
      selectedSurgeries,
      selectedRegions,
      ageGroups,
      genders,
    ]
  )

  const removeChip = (chipId: string, kind: string, value?: string) => {
    switch (kind) {
      case 'date':
        setDateRange('', '')
        break
      case 'window':
        setWindowSize(90)
        break
      case 'disease':
        if (value) removeDisease(value)
        break
      case 'surgery':
        if (value) removeSurgery(value)
        break
      case 'region':
        if (value) removeRegion(value)
        break
      case 'age':
        if (value) toggleAgeGroup(value)
        break
      case 'gender':
        if (value === '남성' || value === '여성') toggleGender(value)
        break
      default:
        break
    }
  }

  return (
    <>
      <div
        className={cn(
          'z-30 border-b border-border/70 bg-card/90 backdrop-blur-md',
          sticky && 'sticky top-[57px]',
          className
        )}
      >
        <div className="flex items-center gap-2 overflow-x-auto px-1 py-2 scrollbar-thin">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 gap-1.5"
            onClick={() => setOpen(true)}
            aria-label="필터 열기"
          >
            <Filter className="h-3.5 w-3.5" />
            필터
            {chips.length > 0 ? (
              <span className="rounded bg-primary/10 px-1.5 text-[10px] font-semibold text-brand">
                {chips.length}
              </span>
            ) : null}
          </Button>

          {chips.length === 0 ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-dashed border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <Plus className="h-3 w-3" />
              필터 추가
            </button>
          ) : (
            chips.map((chip) => (
              <span
                key={chip.id}
                className="inline-flex max-w-[220px] shrink-0 items-center gap-1 rounded-md border border-border/80 bg-background px-2 py-1 text-xs text-foreground"
              >
                <span className="truncate">{chip.label}</span>
                <button
                  type="button"
                  className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                  aria-label={`${chip.label} 제거`}
                  onClick={() => removeChip(chip.id, chip.kind, chip.value)}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))
          )}

          {chips.length > 0 ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="shrink-0 text-xs text-muted-foreground"
              onClick={resetFilters}
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              초기화
            </Button>
          ) : null}
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="overflow-hidden p-0">
          <SheetHeader>
            <SheetTitle>필터</SheetTitle>
            <SheetDescription>
              변경은 즉시 반영됩니다. 완료를 누르면 닫힙니다.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <FilterPanel variant="plain" />
          </div>
          <SheetFooter>
            <Button type="button" className="w-full" onClick={() => setOpen(false)}>
              완료
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
