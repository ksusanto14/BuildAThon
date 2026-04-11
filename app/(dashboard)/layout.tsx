import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { BottomTabs } from "@/components/layout/bottom-tabs";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main id="main-content" className="flex-1 p-4 md:p-6 pb-20 md:pb-6">{children}</main>
      </div>
      <BottomTabs />
    </div>
  );
}
