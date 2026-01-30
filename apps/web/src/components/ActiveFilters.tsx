/* eslint-disable no-unused-vars */
import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { Filters } from '@/components/FilterSheet'

interface ActiveFiltersProps {
  filters: Filters
  showOnlyFavorites: boolean
  onClearFilter: (
    filterType: 'district' | 'cuisine' | 'priceRange' | 'tags' | 'showOpenOnly',
    value?: string
  ) => void
  onClearAll: () => void
}

const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  filters,
  showOnlyFavorites: _showOnlyFavorites,
  onClearFilter,
  onClearAll,
}) => {
  const activeFilters: { type: string; label: string; onRemove: () => void }[] = []

  if (filters.district !== 'all') {
    activeFilters.push({
      type: 'district',
      label: `地區: ${filters.district}`,
      onRemove: () => onClearFilter('district'),
    })
  }

  if (filters.cuisine !== 'all') {
    activeFilters.push({
      type: 'cuisine',
      label: `菜系: ${filters.cuisine}`,
      onRemove: () => onClearFilter('cuisine'),
    })
  }

  if (filters.priceRange[0] !== 1 || filters.priceRange[1] !== 4) {
    activeFilters.push({
      type: 'priceRange',
      label: `價位: ${'$'.repeat(filters.priceRange[0])} - ${'$'.repeat(filters.priceRange[1])}`,
      onRemove: () => onClearFilter('priceRange'),
    })
  }

  filters.tags.forEach((tag) => {
    activeFilters.push({
      type: `tag-${tag}`,
      label: tag,
      onRemove: () => onClearFilter('tags', tag),
    })
  })

  if (filters.showOpenOnly) {
    activeFilters.push({
      type: 'showOpenOnly',
      label: '現在營業中',
      onRemove: () => onClearFilter('showOpenOnly'),
    })
  }

  if (activeFilters.length === 0) {
    return null
  }

  return (
    <div className="animate-fade-in mb-6 rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-muted-foreground">已套用的篩選條件</h4>
        <Button variant="ghost" size="sm" onClick={onClearAll} className="-mr-2 h-auto py-1">
          全部清除
        </Button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {activeFilters.map((filter) => (
          <Badge
            key={filter.type}
            variant="secondary"
            className="shrink-0 py-1 pl-3 pr-1 text-sm font-normal"
          >
            <span className="mr-1">{filter.label}</span>
            <button
              onClick={filter.onRemove}
              className="rounded-full p-0.5 hover:bg-background/80"
              aria-label={`移除篩選條件: ${filter.label}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  )
}

export default ActiveFilters
