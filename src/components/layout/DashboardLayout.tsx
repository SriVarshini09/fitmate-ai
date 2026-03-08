import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Activity } from "lucide-react";

const DashboardLayout = () => {
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Top bar */}
          <header className="sticky top-0 z-40 flex items-center gap-3 px-4 md:px-6 h-14 border-b border-border/40" style={{
            background: "hsl(80 8% 8% / 0.85)",
            backdropFilter: "blur(20px)",
          }}>
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex items-center gap-2 mr-auto">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center md:hidden">
                <Activity className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold font-display text-foreground text-sm md:hidden">VitalFlow</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/")}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors font-body"
              >
                Back to site
              </button>
              <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
                <span className="text-xs font-bold text-primary font-display">JD</span>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
