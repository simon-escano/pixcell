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
import { Moon, Sun, Check, ContactRound, FileText, Images, Settings, Send, UsersRound } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BreadcrumbOrganizationDropdown } from "./breadcrumb-organization-dropdown";

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
  if (prevSegment === "members") return "user";

  return null;
}

interface HeaderProps {
  organizations: {
    id: string;
    name: string | null;
    imageUrl: string | null;
  }[];
}

const Header = ({ organizations }: HeaderProps) => {
  const pathname = usePathname() || "";
  const pathArray = pathname.split("/").filter(Boolean)
  const { theme, setTheme } = useTheme();
  const [segmentNames, setSegmentNames] = useState<Record<number, string>>({});

  // Check if we're in an organization route
  const orgIndex = pathArray.indexOf("organizations");
  const isOrgRoute = orgIndex !== -1;

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

  // For organization routes, simplify the breadcrumb: [org dropdown] > current page
  // Skip "organizations" and the organization ID segments
  const getBreadcrumbSegments = () => {
    if (isOrgRoute && orgIndex !== -1) {
      // Start from after the organization ID
      const segmentsAfterOrg = pathArray.slice(orgIndex + 2);
      return segmentsAfterOrg;
    }
    return pathArray;
  };

  const breadcrumbSegments = getBreadcrumbSegments();

  // Map page segments to their icons and display names
  const getPageInfo = (segment: string): { name: string; icon: React.ComponentType<{ className?: string }> | null } | null => {
    // Only show icon for main page segments
    if (segment === "patients") {
      return { name: "Patients", icon: ContactRound };
    }
    if (segment === "samples") {
      return { name: "Samples", icon: Images };
    }
    if (segment === "reports") {
      return { name: "Reports", icon: FileText };
    }
    if (segment === "members") {
      return { name: "Members", icon: UsersRound };
    }
    if (segment === "settings") {
      return { name: "Settings", icon: Settings };
    }
    if (segment === "feedback") {
      return { name: "Feedback", icon: Send };
    }
    
    return null;
  };

  return (
    <header className="flex items-center justify-between gap-2 px-4 py-2 border-b border-sidebar-border">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {isOrgRoute && organizations.length > 0 && (
              <>
                <BreadcrumbItem>
                  <BreadcrumbOrganizationDropdown organizations={organizations} />
                </BreadcrumbItem>
                {breadcrumbSegments.length > 0 && (
                  <BreadcrumbSeparator className="hidden md:block" />
                )}
              </>
            )}
            {breadcrumbSegments.map((segment, index) => {
              const actualIndex = isOrgRoute 
                ? orgIndex + 2 + index 
                : index;
              const href = "/" + pathArray.slice(0, actualIndex + 1).join("/");
              const isLast = index === breadcrumbSegments.length - 1;
              const pageInfo = getPageInfo(segment);
              const displayText = pageInfo?.name || truncate(formatSegment(segment, actualIndex));
              const Icon = pageInfo?.icon;

              return (
                <React.Fragment key={index}>
                  <BreadcrumbItem
                    className={
                      index < breadcrumbSegments.length - 1 ? "hidden md:block" : ""
                    }
                  >
                    {isLast ? (
                      <BreadcrumbPage className="flex items-center gap-2">
                        {Icon && <Icon className="size-4 text-primary" />}
                        <span>{displayText}</span>
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={href} className="flex items-center gap-2">
                        {Icon && <Icon className="size-4 text-primary" />}
                        <span>{displayText}</span>
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
    </header>
  );
};

export default Header;