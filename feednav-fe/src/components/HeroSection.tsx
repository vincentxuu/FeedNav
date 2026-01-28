import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HeroSectionProps {
  onRandomSelect: () => void;
}

const HeroSection = ({ onRandomSelect }: HeroSectionProps) => {
  return (
    <div className="text-center py-16 md:py-24 bg-gradient-to-b from-background to-secondary/20">
      <div className="container">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-primary mb-4 animate-fade-in">
          在美食之都，不再選擇困難
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          從數百家精選餐廳中，讓 AI 為您找到今日完美的一餐。
        </p>
        <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="lg" onClick={onRandomSelect} className="shadow-lg transform transition-transform hover:scale-105">
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
  );
};

export default HeroSection;