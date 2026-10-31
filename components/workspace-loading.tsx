import { Logo, Sun } from "./ui";
export default function WorkspaceLoading() {
  return (
    <main className="boot" role="status">
      <Logo />
      <Sun size={60} />
      <p>Opening your next good month…</p>
    </main>
  );
}
