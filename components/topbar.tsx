"use client";

import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function Topbar({ children }: { children?: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      setUser(JSON.parse(userData));
    } else {
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center flex-col gap-4">
        {/* <h2 className="text-xl font-semibold">Not signed in</h2>
        <Button asChild variant="outline">
          <Link href="/login">Sign in</Link>
        </Button> */}
      </div>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 mb-4">
      <nav className="flex h-16 items-center justify-between px-4 w-full">
        {/* Left Section */}
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          {children}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full px-2 py-1.5 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user.avatar || "/user.png"}
                    alt={user.name || "User"}
                  />
                  <AvatarFallback className="bg-primary/5">
                    {user.name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline-flex text-sm font-medium">
                  {user.name || user.email?.split("@")[0]}
                </span>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-64 p-2 rounded-xl border bg-popover/95 backdrop-blur-sm shadow-lg"
            >
              <div className="flex items-center gap-3 p-2 rounded-md">
                <Avatar className="h-10 w-10 border-2 border-primary/10">
                  <AvatarImage
                    src={user.avatar || "/user.png"}
                    alt={user.name || "User Avatar"}
                  />
                  <AvatarFallback className="bg-primary/5">
                    {user.name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {user.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {user.email}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-primary mt-0.5">
                    {user.role}
                  </span>
                </div>
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild className="rounded-md cursor-pointer">
                <Link
                  href="/account"
                  className="flex items-center gap-2 py-1.5"
                >
                  <User className="h-4 w-4" />
                  <span className="text-sm">Profile</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem className="rounded-md text-red-500 hover:text-red-600 cursor-pointer focus:text-red-600" onClick={handleLogout}>
                <span className="flex w-full items-center gap-2 py-1.5 text-sm font-medium">
                  Log out
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </header>
  );
}