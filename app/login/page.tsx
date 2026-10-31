import { redirect } from "next/navigation";
import AuthPage from "@/components/auth-page";
import { currentUser } from "@/lib/auth";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; token?: string; area?: string }>;
}) {
  const query = await searchParams;
  const user = await currentUser();
  if (user)
    redirect(
      user.role === "customer"
        ? query.plan
          ? `/portal/plans?plan=${encodeURIComponent(query.plan)}`
          : "/portal"
        : "/admin",
    );
  return (
    <AuthPage
      kind="login"
      admin={query.area === "admin"}
      plan={query.plan}
      token={query.token}
      configured={Boolean(process.env.DATABASE_URL)}
    />
  );
}
