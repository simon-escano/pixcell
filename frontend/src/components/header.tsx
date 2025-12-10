"use client";

import React from "react";
import { SidebarTrigger } from "./ui/sidebar";
import { Separator } from "@radix-ui/react-separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { usePathname } from "next/navigation";
import { Moon, Sun, Check } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const truncate = (text: string, limit = 13) =>
  text.length > limit ? text.slice(0, limit) + "…" : text


const Header = () => {
  const pathname = usePathname() || "";
  const pathArray = pathname.split("/").filter(Boolean)
  const { theme, setTheme } = useTheme();

  const formatSegment = (segment: string) =>
  /^[a-zA-Z]/.test(segment)
    ? segment.charAt(0).toUpperCase() + segment.slice(1)
    : segment;

  return (
    <header className="flex h-16 shrink-0 items-center gap-2">
      <div className="flex flex-1 items-center justify-between gap-2 px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              {pathArray.map((segment, index) => {
                const href = "/" + pathArray.slice(1, index + 1).join("/");
                const isLast = index === pathArray.length - 1;

                return (
                  <React.Fragment key={index}>
                    <BreadcrumbItem
                      className={
                        index < pathArray.length - 1 ? "hidden md:block" : ""
                      }
                    >
                      {isLast ? (
                        <BreadcrumbPage>
                          {truncate(formatSegment(segment))}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={href}>
                          {truncate(formatSegment(segment))}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {!isLast && (
                      <BreadcrumbSeparator className="hidden md:block" />
                    )}
                  </React.Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <div className="flex items-center justify-between w-full">
                Light
                {theme === "light" && <Check className="h-4 w-4" />}
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <div className="flex items-center justify-between w-full">
                Dark
                {theme === "dark" && <Check className="h-4 w-4" />}
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <div className="flex items-center justify-between w-full">
                System
                {theme === "system" && <Check className="h-4 w-4" />}
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;