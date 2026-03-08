import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
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
import Training from "./pages/Training";
import FastingTimer from "./pages/FastingTimer";
import Tablets from "./pages/Tablets";
import Activities from "./pages/Activities";
import WorkoutLogger from "./pages/WorkoutLogger";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/onboarding" element={<Onboarding />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
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
              <Route path="training" element={<Training />} />
              <Route path="fasting" element={<FastingTimer />} />
              <Route path="tablets" element={<Tablets />} />
              <Route path="workout" element={<WorkoutLogger />} />
              <Route path="activities" element={<Activities />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
