"use client";

import type { Session } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, LogOut, Heart, Footprints } from "lucide-react";
import { UserFavorite, UserVisitedRestaurant } from "@/types";
import Link from "next/link";

interface UserNavProps {
  session: Session;
  handleLogout: () => void;
  favorites: UserFavorite[];
  visited: UserVisitedRestaurant[];
}

const UserNav = ({
  session,
  handleLogout,
  favorites: _favorites,
  visited: _visited,
}: UserNavProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full">
          <User className="h-4 w-4" />
          <span className="sr-only">Toggle user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">已登入</p>
            <p className="text-xs leading-none text-muted-foreground">
              {session.user?.email || '未知用戶'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/favorites">
            <Heart className="mr-2 h-4 w-4" />
            <span>我的收藏</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/visited">
            <Footprints className="mr-2 h-4 w-4" />
            <span>美食足跡</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>登出</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserNav;