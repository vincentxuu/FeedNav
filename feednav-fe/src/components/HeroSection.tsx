import { Button } from '@/components/ui/button'
import { MapPin } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface HeroSectionProps {
  onRandomSelect: () => void
}

const HeroSection = ({ onRandomSelect }: HeroSectionProps) => {
  return (
    <div className="bg-gradient-to-b from-background to-secondary/20 py-16 text-center md:py-24">
      <div className="container">
        <h1 className="animate-fade-in mb-4 text-4xl font-extrabold tracking-tight text-primary md:text-5xl">
          在美食之都，不再選擇困難
        </h1>
        <p
          className="animate-fade-in mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl"
          style={{ animationDelay: '0.2s' }}
        >
          從數百家精選餐廳中，讓 AI 為您找到今日完美的一餐。
        </p>
        <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="lg"
                onClick={onRandomSelect}
                className="transform shadow-lg transition-transform hover:scale-105"
              >
                <MapPin className="mr-2 h-5 w-5" />
                附近吃什麼？
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>優先從您所在位置附近隨機挑選餐廳</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

export default HeroSection
