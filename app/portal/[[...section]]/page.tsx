import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import WorkspacePage from "@/components/workspace-page";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ section?: string[] }>;
  searchParams: Promise<{ plan?: string }>;
}) {
  const query = await searchParams;
  const user = await currentUser();
  if (!user)
    redirect(
      `/login${query.plan ? `?plan=${encodeURIComponent(query.plan)}` : ""}`,
    );
  return (
    <WorkspacePage
      section={(await params).section}
      plan={query.plan}
      viewer={user}
      customer
    />
  );
}
