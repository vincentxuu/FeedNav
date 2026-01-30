'use client'

/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from 'react'
import { Restaurant } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface RandomSelectorModalProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  restaurants: Restaurant[]
}

const RandomSelectorModal = ({ isOpen, onOpenChange, restaurants }: RandomSelectorModalProps) => {
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [displayText, setDisplayText] = useState('準備中...')
  const router = useRouter()

  const startSelection = useCallback(() => {
    if (!restaurants || restaurants.length === 0) {
      setIsSelecting(false)
      setSelectedRestaurant(null)
      setDisplayText('沒有可選的餐廳')
      return () => {} // Return empty cleanup function
    }

    setIsSelecting(true)
    setSelectedRestaurant(null)

    const selectionInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * restaurants.length)
      setDisplayText(restaurants[randomIndex].name)
    }, 100)

    const timeout = setTimeout(() => {
      clearInterval(selectionInterval)
      const finalRandomIndex = Math.floor(Math.random() * restaurants.length)
      const finalRestaurant = restaurants[finalRandomIndex]
      setSelectedRestaurant(finalRestaurant)
      setIsSelecting(false)
    }, 2500)

    // Return cleanup function
    return () => {
      clearInterval(selectionInterval)
      clearTimeout(timeout)
    }
  }, [restaurants])

  useEffect(() => {
    if (isOpen) {
      const cleanup = startSelection()
      return cleanup
    }
  }, [isOpen, startSelection])

  const handleGoToRestaurant = () => {
    if (selectedRestaurant) {
      onOpenChange(false)
      router.push(`/restaurant/${selectedRestaurant.id}`)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  const handleReselect = () => {
    startSelection()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>今天就吃這家！</DialogTitle>
          <DialogDescription>從精選餐廳中為你挑選</DialogDescription>
        </DialogHeader>

        <div className="my-4 flex min-h-[100px] items-center justify-center rounded-lg bg-muted/50 py-8 text-center">
          {isSelecting ? (
            <div className="transition-all duration-100">
              <p className="text-3xl font-bold text-foreground">{displayText}</p>
            </div>
          ) : selectedRestaurant ? (
            <div className="animate-scale-in">
              <h3 className="text-3xl font-bold text-primary">{selectedRestaurant.name}</h3>
              <p className="mt-2 text-muted-foreground">
                {selectedRestaurant.cuisine_type} • {selectedRestaurant.district}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">{displayText}</p>
          )}
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {selectedRestaurant ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                關閉
              </Button>
              <Button variant="secondary" onClick={handleReselect}>
                再選一次
              </Button>
              <Button onClick={handleGoToRestaurant}>就是這家！</Button>
            </>
          ) : (
            <Button variant="outline" onClick={handleClose} className="w-full">
              {isSelecting ? '取消中...' : '關閉'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default RandomSelectorModal
