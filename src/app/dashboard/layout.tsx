import { Sidebar } from "@/components/dashboard/Sidebar";
import { PetProvider } from "@/contexts/PetContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PetProvider>
      <div className="flex min-h-screen bg-stone-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-6xl p-8">{children}</div>
        </main>
      </div>
    </PetProvider>
  );
}
