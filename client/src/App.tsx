import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import VehicleManagement from "@/pages/vehicle-management";
import DriveHistory from "@/pages/drive-history";
import UserManagement from "@/pages/user-management";
import GoogleSheetsSetup from "@/pages/google-sheets-setup";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/vehicle-management" component={VehicleManagement} />
      <Route path="/drive-history" component={DriveHistory} />
      <Route path="/user-management" component={UserManagement} />
      <Route path="/google-sheets" component={GoogleSheetsSetup} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
