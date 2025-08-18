import { auth } from "@clerk/nextjs/server";
import HomePageClient from "@/components/HomePageClient";

export default async function Page() {
  const { userId } = await auth();

  console.log("Server - userId:", userId);
  console.log("Server - isAuthenticated:", !!userId);

  // Pass the initial auth state to the client component
  return <HomePageClient initialUserId={userId} />;
}
