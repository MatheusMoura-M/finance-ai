import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
// import { UserButton } from "@clerk/nextjs";
import Navbar from "@/app/_components/navbar";

export default function Home() {
  const { userId } = auth();

  if (!userId) {
    redirect("/login");
  }

  return (
    // <div className="flex h-full items-center justify-center">
    //   <UserButton showName />
    // </div>
    <Navbar />
  );
}
