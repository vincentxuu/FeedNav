import { Skeleton } from '@/components/ui/skeleton'

const RestaurantDetailSkeleton = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="mx-auto max-w-3xl">
        <Skeleton className="mb-8 h-80 w-full rounded-lg" />
        <div className="mb-8">
          <Skeleton className="mb-2 h-10 w-3/4" />
          <Skeleton className="mb-4 h-5 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
        <div className="grid gap-8 md:grid-cols-3 lg:gap-12">
          <div className="space-y-6 md:col-span-2">
            <Skeleton className="mb-2 h-8 w-1/3" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="mb-4 h-8 w-1/2" />
            <Skeleton className="h-80 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default RestaurantDetailSkeleton
