import Link from "next/link";
import { Button } from "@/components/ui/button";

const RestaurantNotFound = () => {
  return (
    <div className="text-center py-16">
      <h2 className="text-3xl font-bold mb-4">找不到餐廳</h2>
      <p className="text-muted-foreground mb-6">您要找的餐廳可能不存在或已被移除。</p>
      <Button asChild>
        <Link href="/">回到首頁</Link>
      </Button>
    </div>
  );
};

export default RestaurantNotFound;