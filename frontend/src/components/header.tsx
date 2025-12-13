"use client";

import React, { useEffect, useState } from "react";
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

// Check if a string is a UUID
const isUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Determine the type of ID based on path structure
const getSegmentType = (segment: string, index: number, pathArray: string[]): string | null => {
  if (!isUUID(segment)) return null;

  const prevSegment = index > 0 ? pathArray[index - 1] : null;

  // Check previous segment to determine type
  if (prevSegment === "organizations") return "organization";
  if (prevSegment === "patients") return "patient";
  if (prevSegment === "samples") {
    // If previous segment was "samples", this is sampleId
    return "sample";
  }
  // If previous segment is a UUID and the segment before that was "samples", this is sampleImageId
  if (prevSegment && isUUID(prevSegment) && index > 1 && pathArray[index - 2] === "samples") {
    return null; // sampleImageId - keep as ID
  }
  if (prevSegment === "reports") return "report";
  if (prevSegment === "users") return "user";

  return null;
}

const Header = () => {
  const pathname = usePathname() || "";
  const pathArray = pathname.split("/").filter(Boolean)
  const { theme, setTheme } = useTheme();
  const [segmentNames, setSegmentNames] = useState<Record<number, string>>({});

  // Fetch names for ID segments
  useEffect(() => {
    const fetchNames = async () => {
      const names: Record<number, string> = {};
      
      for (let i = 0; i < pathArray.length; i++) {
        const segment = pathArray[i];
        const type = getSegmentType(segment, i, pathArray);
        
        if (type) {
          try {
            const response = await fetch(`/api/breadcrumb/${segment}?type=${type}`);
            if (response.ok) {
              const data = await response.json();
              if (data.name) {
                names[i] = data.name;
              }
            }
          } catch (error) {
            console.error(`Error fetching name for ${segment}:`, error);
          }
        }
      }
      
      setSegmentNames(names);
    };

    fetchNames();
  }, [pathname]);

  const formatSegment = (segment: string, index: number) => {
    // If we have a name for this segment, use it
    if (segmentNames[index]) {
      return segmentNames[index];
    }
    
    // If it's a UUID and we don't have a name yet, show a loading state or the ID
    if (isUUID(segment)) {
      const type = getSegmentType(segment, index, pathArray);
      // If it's sampleImageId, show the ID (as per user's request)
      if (!type) {
        return segment.slice(0, 8); // Truncate UUID for sampleImageId
      }
      // Otherwise show truncated ID while loading
      return segment.slice(0, 8) + "...";
    }
    
    // Regular text segment
    return /^[a-zA-Z]/.test(segment)
      ? segment.charAt(0).toUpperCase() + segment.slice(1)
      : segment;
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-2">
      <div className="flex flex-1 items-center justify-between gap-2 px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              {pathArray.map((segment, index) => {
                const href = "/" + pathArray.slice(0, index + 1).join("/");
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
                          {truncate(formatSegment(segment, index))}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={href}>
                          {truncate(formatSegment(segment, index))}
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