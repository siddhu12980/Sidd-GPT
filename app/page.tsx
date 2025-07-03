import { auth } from "@clerk/nextjs/server";
import Home from "@/components/Home";
import LimitedHome from "@/components/LandingPage";

export default async function Page() {
  const { userId } = await auth();

  if (!userId) {
    return <LimitedHome />;
  }

  return <Home />;
}
