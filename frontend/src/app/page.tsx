import { redirect } from "next/navigation";

export const metadata = {
  title: "PixCell",
};

export default function Home() {
  redirect("/organizations"); 
}