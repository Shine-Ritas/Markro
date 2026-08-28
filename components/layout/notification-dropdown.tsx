"use client";

import { Bell } from "lucide-react";
import { formatActionLabel, timeAgo } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { shellToolbarButtonClass } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ActivityItem } from "@/lib/dashboard";

type NotificationDropdownProps = {
  activities: ActivityItem[];
};

export function NotificationDropdown({ activities }: NotificationDropdownProps) {
  const count = activities.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className={cn(shellToolbarButtonClass, "relative size-8 shrink-0")}
          />
        }
      >
        <Bell className="size-4" />
        {count > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
        <span className="sr-only">Notifications</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          {activities.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No notifications yet
            </p>
          ) : (
            activities.slice(0, 5).map((item) => (
              <DropdownMenuItem
                key={item.id}
                className="flex flex-col items-start gap-1 py-2"
              >
                <span className="text-sm font-medium capitalize">
                  {formatActionLabel(item.action)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {item.entity ?? "system"} · {timeAgo(item.createdAt)}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem disabled className="text-xs text-muted-foreground">
            Email & push alerts — Phase 10
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
