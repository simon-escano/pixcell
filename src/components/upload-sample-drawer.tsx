import * as React from "react";
import { ImageUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { getPatients } from "@/db/queries/select";
import UploadSampleDrawerClient from "@/components/upload-sample-drawer-client";

export async function UploadSampleDrawer() {
  const patients = await getPatients();

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 flex-1 justify-start duration-200 ease-linear">
          <ImageUp />
          <span>Upload sample</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Upload sample</DrawerTitle>
            <DrawerDescription>
              Submit a sample to share or for analysis
            </DrawerDescription>
          </DrawerHeader>
          <UploadSampleDrawerClient patients={patients} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
