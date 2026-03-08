import {
  Home, UtensilsCrossed, BarChart3, Bot, Target, Brain, Zap,
  Calculator, Trophy, CalendarDays, MessageCircle, Heart, MapPin,
  Dumbbell, Timer, Activity, Pill
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Food Log", url: "/dashboard/food", icon: UtensilsCrossed },
  { title: "Insights", url: "/dashboard/insights", icon: BarChart3 },
  { title: "AI Coach", url: "/dashboard/ai-chat", icon: Bot },
];

const trackingItems = [
  { title: "Activities", url: "/dashboard/activities", icon: MapPin },
  { title: "Workouts", url: "/dashboard/workout", icon: Dumbbell },
  { title: "Fasting", url: "/dashboard/fasting", icon: Timer },
  { title: "Goals", url: "/dashboard/goals", icon: Target },
  { title: "Cycle Tracker", url: "/dashboard/cycle", icon: Heart },
];

const moreItems = [
  { title: "Meal Planner", url: "/dashboard/planner", icon: CalendarDays },
  { title: "Lifestyle", url: "/dashboard/lifestyle", icon: Brain },
  { title: "Motivation", url: "/dashboard/motivation", icon: Zap },
  { title: "Tools", url: "/dashboard/tools", icon: Calculator },
  { title: "Badges", url: "/dashboard/badges", icon: Trophy },
  { title: "Community", url: "/dashboard/community", icon: MessageCircle },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && <span className="font-bold font-display text-gradient-primary text-lg">VitalFlow</span>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end activeClassName="bg-primary/10 text-primary font-medium">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tracking</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {trackingItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end activeClassName="bg-primary/10 text-primary font-medium">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>More</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {moreItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end activeClassName="bg-primary/10 text-primary font-medium">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
