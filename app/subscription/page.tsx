import Navbar from "../_components/navbar";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const SubscriptionPage = () => {
  const { userId } = auth();

  if (!userId) {
    redirect("/login");
  }
  return <Navbar />;
};

export default SubscriptionPage;
