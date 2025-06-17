import React from "react"

interface TableSkeletonProps {
  columns?: number
  rows?: number
}

export function TableSkeleton({ columns = 5, rows = 6 }: TableSkeletonProps) {
  return (
    <div className="rounded-md border overflow-hidden">
      <table className="w-full caption-bottom text-sm">
        <thead>
          <tr className="border-b bg-muted/50 transition-colors">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="h-12 px-4">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx} className="border-b">
              {Array.from({ length: columns }).map((_, colIdx) => (
                <td key={colIdx} className="p-4">
                  <div className="h-4 w-full bg-muted animate-pulse rounded" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
} 