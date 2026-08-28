"use client";

import { signOut } from "next-auth/react";
import { KeyRound, LogOut, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shellToolbarButtonClass } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserMenuProps = {
  name?: string | null;
  email: string;
  roleSlug?: string;
  authProviders: string[];
  image?: string | null;
};

function ProviderBadge({ provider }: { provider: string }) {
  if (provider === "google") {
    return (
      <Badge variant="outline" className="gap-1 text-xs">
        <Sparkles className="size-3" />
        Google
      </Badge>
    );
  }
  if (provider === "credentials") {
    return (
      <Badge variant="outline" className="gap-1 text-xs">
        <KeyRound className="size-3" />
        Email
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-xs capitalize">
      {provider}
    </Badge>
  );
}

export function UserMenu({
  name,
  email,
  roleSlug,
  authProviders,
  image,
}: UserMenuProps) {
  const displayName = name ?? email.split("@")[0];
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="sm" className={cn(shellToolbarButtonClass, "pl-1.5")} />
        }
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="size-6 rounded-full object-cover" />
        ) : (
          <span className="flex size-6 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
            {initial}
          </span>
        )}
        <span className="hidden max-w-[120px] truncate sm:inline">{displayName}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-1">
              <p className="font-medium">{displayName}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Mail className="size-3" />
                {email}
              </p>
              {roleSlug ? (
                <p className="text-xs capitalize text-muted-foreground">
                  Role: {roleSlug.replace("_", " ")}
                </p>
              ) : null}
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Signed in via</DropdownMenuLabel>
          <div className="flex flex-wrap gap-1 px-2 pb-1.5">
            {authProviders.length > 0 ? (
              authProviders.map((p) => <ProviderBadge key={p} provider={p} />)
            ) : (
              <ProviderBadge provider="credentials" />
            )}
          </div>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
