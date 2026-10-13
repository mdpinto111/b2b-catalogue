import { redirect } from "next/navigation";
import { getClientSession } from "@/lib/auth";

export default async function Home() {
  const s = await getClientSession();
  redirect(s ? "/catalogue" : "/login");
}
