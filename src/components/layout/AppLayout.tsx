import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 pb-24 overflow-y-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
