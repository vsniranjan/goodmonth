import { redirect } from "next/navigation";
import AuthPage from "@/components/auth-page";
import { currentUser } from "@/lib/auth";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; token?: string; area?: string }>;
}) {
  const query = await searchParams;
  return (
    <AuthPage
      kind="forgot"
      admin={query.area === "admin"}
      plan={query.plan}
      token={query.token}
      configured={Boolean(process.env.DATABASE_URL)}
    />
  );
}
