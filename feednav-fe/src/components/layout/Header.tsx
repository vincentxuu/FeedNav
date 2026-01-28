"use client";

/* eslint-disable no-unused-vars */
import type { Session } from "@/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import FilterSheet, { Filters } from "@/components/FilterSheet";
import { UserFavorite, UserVisitedRestaurant } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Dices, Map as MapIcon } from "lucide-react";
import UserNav from "./UserNav";
import { ThemeToggle } from "./ThemeToggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HeaderProps {
  session: Session | null;
  handleLogout: () => void;
  favorites: UserFavorite[];
  visited: UserVisitedRestaurant[];
  searchTerm?: string;
  setSearchTerm?: (value: string) => void;
  sortBy?: string;
  setSortBy?: (value: string) => void;
  filters?: Filters;
  setFilters?: (filters: Filters) => void;
  handleRandomSelect?: () => void;
}

const Header = ({
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  filters,
  setFilters,
  session,
  handleRandomSelect,
  handleLogout,
  favorites,
  visited,
}: HeaderProps) => {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
      <div className="container py-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <Link href="/" className="text-2xl font-bold text-primary">餵你導航</Link>
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
            {searchTerm !== undefined && setSearchTerm && (
              <div className="relative flex-grow w-full sm:w-auto sm:flex-grow-0 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="搜尋餐廳名稱..."
                  className="pl-9 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
            {pathname !== '/map' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" asChild className="whitespace-nowrap">
                    <Link href="/map">
                      <MapIcon className="mr-2 h-4 w-4" />
                      地圖模式
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>切換到地圖瀏覽模式</p>
                </TooltipContent>
              </Tooltip>
            )}
            {handleRandomSelect && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={handleRandomSelect} className="whitespace-nowrap">
                    <Dices className="mr-2 h-4 w-4" />
                    幫我決定
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>從目前篩選結果中隨機挑選</p>
                </TooltipContent>
              </Tooltip>
            )}
            {sortBy !== undefined && setSortBy && filters && setFilters && (
              <FilterSheet
                sortBy={sortBy}
                setSortBy={setSortBy}
                filters={filters}
                onFiltersChange={setFilters}
              />
            )}
            <ThemeToggle />
            {session ? (
              <UserNav
                session={session}
                handleLogout={handleLogout}
                favorites={favorites}
                visited={visited}
              />
            ) : (
              <Button asChild>
                <Link href="/auth">登入 / 註冊</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;