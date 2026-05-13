import { HomePage } from "@/components/home/home-page";
import { getCurrentMoonStatus } from "@/lib/lunar.server";

export default async function Home() {
  const moonStatus = await getCurrentMoonStatus();
  return <HomePage moonStatus={moonStatus} />;
}
