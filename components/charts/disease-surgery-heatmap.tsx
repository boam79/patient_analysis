'use client'

interface DiseaseSurgeryHeatmapProps {
  columns: string[]
  rows: {
    disease: string
    values: Record<string, number>
  }[]
  maxValue: number
}

export function DiseaseSurgeryHeatmap({
  columns,
  rows,
  maxValue,
}: DiseaseSurgeryHeatmapProps) {
  const safeMax = maxValue > 0 ? maxValue : 1

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/60">
          <tr>
            <th className="px-3 py-2 text-left font-semibold text-muted-foreground">질병 / 수술</th>
            {columns.map((column) => (
              <th key={column} className="px-3 py-2 text-center font-medium text-muted-foreground">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.disease} className="border-t">
              <td className="px-3 py-2 font-medium">{row.disease}</td>
              {columns.map((column) => {
                const value = row.values[column] ?? 0
                const intensity = value / safeMax
                const background = `rgba(59, 130, 246, ${0.08 + intensity * 0.75})`

                return (
                  <td
                    key={column}
                    className="px-3 py-2 text-center text-sm font-semibold text-primary-foreground"
                    style={{
                      backgroundColor: value === 0 ? 'rgba(148, 163, 184, 0.15)' : background,
                      color: value === 0 ? 'hsl(var(--muted-foreground))' : 'white',
                    }}
                  >
                    {value.toLocaleString()}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

