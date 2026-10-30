import { requireAdmin } from "@/lib/auth";
import { AdminSubnav } from "@/components/admin-subnav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex-1 flex flex-col bg-background">
      <AdminSubnav />
      <div className="flex-1">{children}</div>
    </div>
  );
}