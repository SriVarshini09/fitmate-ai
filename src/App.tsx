import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import DashboardLayout from "./components/layout/DashboardLayout";
import Index from "./pages/Index";
import WeeklyPlanner from "./pages/WeeklyPlanner";
import FoodLog from "./pages/FoodLog";
import Community from "./pages/Community";
import AiChat from "./pages/AiChat";
import Badges from "./pages/Badges";
import CycleTracker from "./pages/CycleTracker";
import Goals from "./pages/Goals";
import Insights from "./pages/Insights";
import Lifestyle from "./pages/Lifestyle";
import Motivation from "./pages/Motivation";
import Tools from "./pages/Tools";
import Activities from "./pages/Activities";
import WorkoutLogger from "./pages/WorkoutLogger";
import FastingTimer from "./pages/FastingTimer";
import Tablets from "./pages/Tablets";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Index />} />
            <Route path="food" element={<FoodLog />} />
            <Route path="planner" element={<WeeklyPlanner />} />
            <Route path="community" element={<Community />} />
            <Route path="ai-chat" element={<AiChat />} />
            <Route path="badges" element={<Badges />} />
            <Route path="cycle" element={<CycleTracker />} />
            <Route path="goals" element={<Goals />} />
            <Route path="insights" element={<Insights />} />
            <Route path="lifestyle" element={<Lifestyle />} />
            <Route path="motivation" element={<Motivation />} />
            <Route path="tools" element={<Tools />} />
            <Route path="activities" element={<Activities />} />
            <Route path="workout" element={<WorkoutLogger />} />
            <Route path="fasting" element={<FastingTimer />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
