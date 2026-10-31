import Link from "next/link";
import { Logo } from "@/components/ui";
export default function NotFound() {
  return (
    <main className="boot">
      <Link href="/">
        <Logo />
      </Link>
      <h1>A little off the beaten path.</h1>
      <p>This page isn’t here. Let’s get you back to a good place.</p>
      <Link className="site-button" href="/">
        Back to Goodmonth
      </Link>
    </main>
  );
}
