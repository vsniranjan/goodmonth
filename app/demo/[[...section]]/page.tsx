import { notFound } from "next/navigation";
import Goodmonth from "@/components/goodmonth";
import { tabForSection } from "@/lib/navigation";
export default async function Page({
  params,
}: {
  params: Promise<{ section?: string[] }>;
}) {
  if (process.env.NEXT_PUBLIC_DEMO_ENABLED === "false") notFound();
  const section = (await params).section;
  const tab =
    section?.[0] === "plans" && section.length === 1
      ? "Plans"
      : tabForSection(section);
  if (!tab) notFound();
  return <Goodmonth demo initialTab={tab} />;
}
