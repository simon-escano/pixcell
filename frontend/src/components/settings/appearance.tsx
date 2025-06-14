"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function SettingsAppearance() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [browserZoom, setBrowserZoom] = useState(100);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
    // Update zoom level
    setBrowserZoom(Math.round(window.devicePixelRatio * 100));

    // Update zoom when it changes
    window.addEventListener('resize', () => {
      setBrowserZoom(Math.round(window.devicePixelRatio * 100));
    });
  }, []);

  if (!mounted) {
    return null; // Return null on server-side and first render
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label>Theme</Label>
          <p className="text-sm text-muted-foreground">
            Select your preferred theme for the application.
          </p>
        </div>
        <Select value={theme} onValueChange={setTheme}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Select theme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                Light
              </div>
            </SelectItem>
            <SelectItem value="dark">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4" />
                Dark
              </div>
            </SelectItem>
            <SelectItem value="system">
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 dark:hidden" />
                <Moon className="hidden h-4 w-4 dark:block" />
                System
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label>Browser Zoom</Label>
          <p className="text-sm text-muted-foreground">
            Hold Ctrl then + or - to adjust browser zoom. (Hold ⌘ then + or - for Mac)
          </p>
        </div>
        <Button variant="outline" className="w-[100px]" disabled>
          {browserZoom}%
        </Button>
      </div>
    </div>
  );
} 