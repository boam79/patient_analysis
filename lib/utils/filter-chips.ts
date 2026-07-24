export type FilterChipKind =
  | 'date'
  | 'window'
  | 'disease'
  | 'surgery'
  | 'region'
  | 'age'
  | 'gender'

export interface FilterChip {
  id: string
  kind: FilterChipKind
  label: string
  /** store 제거용 값 (질병명·지역명 등). window/date는 생략 가능 */
  value?: string
}

export interface FilterChipInput {
  dateRange: { start: string; end: string }
  windowSize: number
  defaultWindowSize?: number
  selectedDiseases: string[]
  selectedSurgeries: string[]
  selectedRegions: string[]
  ageGroups: string[]
  genders: string[]
}

/** 활성 필터를 칩 바용 목록으로 변환 */
export function buildFilterChips(input: FilterChipInput): FilterChip[] {
  const chips: FilterChip[] = []
  const defaultWindow = input.defaultWindowSize ?? 90

  if (input.dateRange.start && input.dateRange.end) {
    chips.push({
      id: 'date',
      kind: 'date',
      label: `${input.dateRange.start} ~ ${input.dateRange.end}`,
    })
  }

  if (input.windowSize !== defaultWindow) {
    chips.push({
      id: 'window',
      kind: 'window',
      label: `윈도우 ${input.windowSize}일`,
    })
  }

  for (const disease of input.selectedDiseases) {
    chips.push({
      id: `disease:${disease}`,
      kind: 'disease',
      label: disease,
      value: disease,
    })
  }

  for (const surgery of input.selectedSurgeries) {
    chips.push({
      id: `surgery:${surgery}`,
      kind: 'surgery',
      label: surgery,
      value: surgery,
    })
  }

  for (const region of input.selectedRegions) {
    chips.push({
      id: `region:${region}`,
      kind: 'region',
      label: region,
      value: region,
    })
  }

  for (const age of input.ageGroups) {
    chips.push({
      id: `age:${age}`,
      kind: 'age',
      label: age,
      value: age,
    })
  }

  if (input.genders.length === 1) {
    chips.push({
      id: `gender:${input.genders[0]}`,
      kind: 'gender',
      label: input.genders[0],
      value: input.genders[0],
    })
  }

  return chips
}
