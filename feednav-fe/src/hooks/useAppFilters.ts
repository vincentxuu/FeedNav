'use client'

import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Filters } from '@/components/FilterSheet'

export const initialFilters: Filters = {
  district: 'all',
  cuisine: 'all',
  priceRange: [1, 4],
  tags: [],
  showOpenOnly: false,
}

export const useAppFilters = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('default')
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const { toast } = useToast()

  const handleClearAllFilters = () => {
    setSearchTerm('')
    setFilters(initialFilters)
    setSortBy('default')
    toast({
      title: '已清除所有篩選與搜尋條件',
    })
  }

  const handleClearFilter = (
    filterType: 'district' | 'cuisine' | 'priceRange' | 'tags' | 'showOpenOnly',
    value?: string
  ) => {
    const message = '已移除一個篩選條件'
    if (filterType === 'priceRange') {
      setFilters((prev) => ({ ...prev, priceRange: [1, 4] }))
    } else if (filterType === 'tags' && value) {
      setFilters((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== value) }))
    } else if (filterType === 'district' || filterType === 'cuisine') {
      setFilters((prev) => ({ ...prev, [filterType]: 'all' }))
    } else if (filterType === 'showOpenOnly') {
      setFilters((prev) => ({ ...prev, showOpenOnly: false }))
    }
    toast({ title: message, duration: 2000 })
  }

  return {
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    filters,
    setFilters,
    handleClearAllFilters,
    handleClearFilter,
    initialFilters,
  }
}
