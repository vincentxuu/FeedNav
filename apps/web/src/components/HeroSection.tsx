import { Button } from '@/components/ui/button'
import { Dices } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface HeroSectionProps {
  onRandomSelect: () => void
}

const HeroSection = ({ onRandomSelect }: HeroSectionProps) => {
  return (
    <div className="bg-gradient-to-b from-primary/5 via-background to-secondary/20 py-16 text-center md:py-24">
      <div className="container">
        <h1 className="animate-fade-in mb-4 text-4xl font-extrabold tracking-tight text-primary md:text-5xl">
          發現台北隱藏版美食
        </h1>
        <p
          className="animate-fade-in mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl"
          style={{ animationDelay: '0.2s' }}
        >
          從數百家精選餐廳中，一鍵找到今日完美的一餐
        </p>
        <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="lg"
                onClick={onRandomSelect}
                className="animate-pulse-subtle transform bg-gradient-to-r from-primary to-primary/80 shadow-lg transition-all hover:scale-105 hover:shadow-xl"
              >
                <Dices className="mr-2 h-5 w-5 animate-bounce-gentle" />
                今天吃什麼？
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>從精選餐廳中隨機挑選一家</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

export default HeroSection
