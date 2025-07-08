import { auth,currentUser } from "@clerk/nextjs/server";
import Home from "@/components/Home";
import LimitedHome from "@/components/LandingPage";

export default async function Page() {
  const { userId,isAuthenticated } = await auth();

  console.log("userId", userId);
  console.log("isAuthenticated", isAuthenticated);
  
  const user = await currentUser();
  console.log("user", user);

  if (!userId) {
    return <LimitedHome />;
  }

  return <Home />;
}
