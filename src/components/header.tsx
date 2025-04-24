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

const Header = () => {
  const pathname = usePathname();
  const pathArray = [" ", ...pathname.split("/").filter(Boolean)];

  const formatSegment = (segment: string) => {
    if (!segment) return "PixCell";
    return /^[a-zA-Z]/.test(segment)
      ? segment.charAt(0).toUpperCase() + segment.slice(1)
      : segment;
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-2">
      <div className="flex items-center gap-2 px-4">
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
                        {formatSegment(segment === " " ? "PixCell" : segment)}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={href}>
                        {formatSegment(segment === " " ? "PixCell" : segment)}
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
    </header>
  );
};

export default Header;
