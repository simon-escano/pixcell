"use client";

import { Copy, Forward } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export function ShareDialog() {
  const [currentUrl, setCurrentUrl] = useState<string>("");

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl).then(() => {
      toast.success("Link copied to clipboard!");
    }).catch(err => {
      toast.error("Failed to copy the link.");
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={"outline"}>
          <Forward />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share link</DialogTitle>
          <DialogDescription>
            Anyone who has this link will be able to view this.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="link" className="sr-only">
              Link
            </Label>
            <Input
              id="link"
              value={currentUrl}
              readOnly
            />
          </div>
          <Button type="button" size="sm" className="px-3" onClick={handleCopy}>
            <span className="sr-only">Copy</span>
            <Copy />
          </Button>
        </div>
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
