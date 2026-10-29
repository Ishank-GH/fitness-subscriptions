import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { MemberSubnav } from "@/components/member-subnav";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser();

  // Redirect administrators to the admin oversight portal
  if (session.role === "ADMIN") {
    redirect("/admin/dashboard");
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      <MemberSubnav />
      <div className="flex-1">{children}</div>
    </div>
  );
}

