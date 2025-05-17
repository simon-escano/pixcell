"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";
import { addPatient, updatePatient } from "@/actions/patients";
import { Patient } from "@/db/schema";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Camera } from "lucide-react";

type Props = {
  open?: boolean;
  setOpen?: (open: boolean) => void;
  mode?: "add" | "edit";
  existingPatient?: Patient | null;
  showTrigger?: boolean;
};

export function PatientDialog({
  open: controlledOpen,
  setOpen: setControlledOpen,
  mode = "add",
  existingPatient = null,
  showTrigger = true,
}: Props) {
  const isControlled =
    controlledOpen !== undefined && setControlledOpen !== undefined;

  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen : setInternalOpen;

  const [loading, setLoading] = useState(false);

  const [date, setDate] = useState<Date>();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [sex, setSex] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (existingPatient) {
      setFirstName(existingPatient.firstName);
      setLastName(existingPatient.lastName);
      setEmail(existingPatient.email || "");
      setContactNumber(existingPatient.contactNumber || "");
      setAddress(existingPatient.address || "");
      setHeight(existingPatient.height?.toString() || "");
      setWeight(existingPatient.weight?.toString() || "");
      setSex(existingPatient.sex || "");
      setBloodType(existingPatient.bloodType || "");
      setDate(
        existingPatient.birthDate
          ? new Date(existingPatient.birthDate)
          : undefined,
      );
    }
  }, [existingPatient]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setFile(file);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const toastId = toast.loading(
      mode === "edit" ? "Saving..." : "Adding patient...",
    );

    try {
      if (mode === "edit" && existingPatient) {
        await updatePatient(existingPatient.id, {
          firstName,
          lastName,
          email,
          contactNumber,
          address,
          height: Number(height),
          weight: Number(weight),
          sex,
          bloodType,
          birthDate: date?.toISOString().slice(0, 10) || "",
          file: file ?? undefined,
        });
        toast.success("Patient updated", { id: toastId });
        router.refresh();
      } else {
        await addPatient({
          firstName,
          lastName,
          email,
          contactNumber,
          address,
          height: Number(height),
          weight: Number(weight),
          sex,
          bloodType,
          birthDate: date?.toISOString().slice(0, 10) || "",
          file: file ?? undefined,
        });
        toast.success("Patient added", { id: toastId });
        router.refresh();
      }

      setOpen(false);
    } catch (error) {
      toast.error("Failed to save patient", { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button className="ml-auto">Add Patient</Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Patient" : "Add a Patient"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the patient's information."
              : "Fill out the patient details below. Click add when you're done."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative flex items-center justify-center">
            <Label htmlFor="file-upload">
              <div className="group relative cursor-pointer">
                <Avatar className="size-24">
                  <AvatarImage
                    src={preview || existingPatient?.imageUrl || ""}
                    className="object-cover"
                  />
                  <AvatarFallback>
                    {existingPatient?.firstName[0]}
                    {existingPatient?.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 rounded-full bg-black/0 transition-colors duration-200 group-hover:bg-black/40" />
                <Camera className="absolute top-1/2 left-1/2 size-12 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              </div>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </Label>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Basic Info</Label>
            <div className="flex gap-2">
              <Input
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <Input
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <Input
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="flex gap-2">
              <Input
                placeholder="Contact Number"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
              />
              <DatePicker date={date} setDate={setDate} />
            </div>
            <Textarea
              placeholder="Address"
              className="resize-none"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Medical Info</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Height in cm"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
              <Input
                placeholder="Weight in kg"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={sex} onValueChange={setSex}>
                <SelectTrigger>
                  <SelectValue placeholder="Sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={bloodType} onValueChange={setBloodType}>
                <SelectTrigger>
                  <SelectValue placeholder="Blood Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A−</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B−</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB−</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O−</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Saving..."
                : mode === "edit"
                  ? "Save Changes"
                  : "Add Patient"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
