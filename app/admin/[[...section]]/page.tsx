import WorkspacePage from "@/components/workspace-page";
export default async function Page({
  params,
}: {
  params: Promise<{ section?: string[] }>;
}) {
  return <WorkspacePage section={(await params).section} />;
}
