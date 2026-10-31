export const workspaceTabs = {
  Overview: "",
  Subscriptions: "subscriptions",
  Requests: "requests",
  Customers: "customers",
  Invoices: "invoices",
  Payments: "payments",
  "Products & plans": "catalog",
  "Loyalty club": "loyalty",
  Settings: "settings",
  "My subscription": "",
  Plans: "plans",
} as const;
export type WorkspaceTab = keyof typeof workspaceTabs;
export function tabForSection(
  section: string[] = [],
  customer = false,
): WorkspaceTab | undefined {
  if (!section.length) return customer ? "My subscription" : "Overview";
  if (section.length !== 1) return undefined;
  const tab = (Object.keys(workspaceTabs) as WorkspaceTab[]).find(
    (key) => workspaceTabs[key] === section[0],
  );
  if (customer && !["Plans", "Requests", "Invoices"].includes(tab || ""))
    return undefined;
  if (!customer && (tab === "Plans" || tab === "My subscription"))
    return undefined;
  return tab;
}
