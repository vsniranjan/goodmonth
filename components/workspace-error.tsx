"use client";
import Link from "next/link";
import { Logo } from "./ui";
export default function WorkspaceError({ reset }: { reset: () => void }) {
  return (
    <main className="boot">
      <Link href="/">
        <Logo />
      </Link>
      <h1>Let’s try that again.</h1>
      <p>We couldn’t open this page. Please try again in a moment.</p>
      <button className="site-button" onClick={reset}>
        Try again
      </button>
      <Link href="/login">Back to sign in</Link>
    </main>
  );
}
