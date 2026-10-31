import { redirect, notFound } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { tabForSection } from "@/lib/navigation";
import Goodmonth from "./goodmonth";
import type { Viewer } from "@/lib/types";
export default async function WorkspacePage({
  section,
  customer = false,
  plan,
  viewer,
}: {
  section?: string[];
  customer?: boolean;
  plan?: string;
  viewer?: Viewer;
}) {
  const user = viewer || (await currentUser());
  if (!user)
    redirect(
      customer
        ? `/login${plan ? `?plan=${encodeURIComponent(plan)}` : ""}`
        : "/admin/login",
    );
  if (customer && user.role !== "customer") redirect("/admin");
  if (!customer && user.role === "customer") redirect("/portal");
  const tab = tabForSection(section, customer);
  if (!tab) notFound();
  return <Goodmonth initialTab={tab} />;
}
