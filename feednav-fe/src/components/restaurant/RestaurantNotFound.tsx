import Link from 'next/link'
import { Button } from '@/components/ui/button'

const RestaurantNotFound = () => {
  return (
    <div className="py-16 text-center">
      <h2 className="mb-4 text-3xl font-bold">找不到餐廳</h2>
      <p className="mb-6 text-muted-foreground">您要找的餐廳可能不存在或已被移除。</p>
      <Button asChild>
        <Link href="/">回到首頁</Link>
      </Button>
    </div>
  )
}

export default RestaurantNotFound
