/* eslint-disable no-unused-vars */
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ListFilter } from 'lucide-react'
import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'

export const districts = ['信義區', '大安區', '松山區']
export const cuisines = [
  '中式料理',
  '日式料理',
  '韓式料理',
  '泰式料理',
  '義式料理',
  '美式料理',
  '印度料理',
  '火鍋',
  '燒烤',
  '海鮮',
  '咖啡廳',
  '甜點',
  '素食',
]
export const allTags = [
  '衛生良好',
  '服務優質',
  '環境舒適',
  '環境安靜',
  '電子支付',
  '適合聚餐',
  '約會適合',
  '適合獨食',
  '適合工作',
  '寵物友善',
  '親子友善',
  'CP值高',
  '需要排隊',
  '可訂位',
  '網美打卡',
  '米其林推薦',
  '有包廂',
  '有戶外座位',
  '素食可用',
  '飲控友善',
]

export interface Filters {
  district: string
  cuisine: string
  priceRange: [number, number]
  tags: string[]
  showOpenOnly: boolean
}

interface FilterSheetProps {
  filters: Filters
  onFiltersChange: (newFilters: Filters) => void
  sortBy: string
  setSortBy: (value: string) => void
}

const FilterSheet = ({ filters, onFiltersChange, sortBy, setSortBy }: FilterSheetProps) => {
  const [localFilters, setLocalFilters] = React.useState<Filters>(filters)
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleApply = () => {
    onFiltersChange(localFilters)
    setIsOpen(false)
  }

  const handleReset = () => {
    const defaultFilters: Filters = {
      district: 'all',
      cuisine: 'all',
      priceRange: [1, 4],
      tags: [],
      showOpenOnly: false,
    }
    setLocalFilters(defaultFilters)
    onFiltersChange(defaultFilters)
    setIsOpen(false)
  }

  const handlePriceChange = (value: number[]) => {
    setLocalFilters((prev) => ({ ...prev, priceRange: [value[0], value[1]] }))
  }

  const handleTagChange = (tag: string) => {
    setLocalFilters((prev) => {
      const newTags = prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag]
      return { ...prev, tags: newTags }
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="whitespace-nowrap">
          <ListFilter className="mr-2 h-4 w-4" />
          排序與篩選
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>排序與篩選</SheetTitle>
        </SheetHeader>
        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          <div className="space-y-2">
            <Label htmlFor="sort-by-sheet">排序方式</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger id="sort-by-sheet">
                <SelectValue placeholder="排序方式" />
              </SelectTrigger>
              <SelectContent className="z-[1000]">
                <SelectItem value="default">預設排序</SelectItem>
                <SelectItem value="rating_desc">評分 高 → 低</SelectItem>
                <SelectItem value="price_asc">價格 低 → 高</SelectItem>
                <SelectItem value="price_desc">價格 高 → 低</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="open-now-switch" className="flex flex-col space-y-1">
              <span>現在營業中</span>
              <span className="text-xs font-normal leading-snug text-muted-foreground">
                僅顯示目前營業的餐廳
              </span>
            </Label>
            <Switch
              id="open-now-switch"
              checked={localFilters.showOpenOnly}
              onCheckedChange={(checked) =>
                setLocalFilters((prev) => ({ ...prev, showOpenOnly: checked }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="district">行政區</Label>
            <Select
              value={localFilters.district}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, district: value }))}
            >
              <SelectTrigger id="district">
                <SelectValue placeholder="選擇行政區" />
              </SelectTrigger>
              <SelectContent className="z-[1000]">
                <SelectItem value="all">所有行政區</SelectItem>
                {districts.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cuisine">菜系類型</Label>
            <Select
              value={localFilters.cuisine}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, cuisine: value }))}
            >
              <SelectTrigger id="cuisine">
                <SelectValue placeholder="選擇菜系" />
              </SelectTrigger>
              <SelectContent className="z-[1000]">
                <SelectItem value="all">所有菜系</SelectItem>
                {cuisines.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>價位範圍</Label>
            <Slider
              min={1}
              max={4}
              step={1}
              value={localFilters.priceRange}
              onValueChange={handlePriceChange}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{'$'.repeat(localFilters.priceRange[0])}</span>
              <span>{'$'.repeat(localFilters.priceRange[1])}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>注記標籤</Label>
            <div className="grid grid-cols-2 gap-2">
              {allTags.map((tag) => (
                <div key={tag} className="flex items-center space-x-2">
                  <Checkbox
                    id={tag}
                    checked={localFilters.tags.includes(tag)}
                    onCheckedChange={() => handleTagChange(tag)}
                  />
                  <label
                    htmlFor={tag}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {tag}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={handleReset}>
            重設
          </Button>
          <Button onClick={handleApply}>套用</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export default FilterSheet
