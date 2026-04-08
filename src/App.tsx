import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { SportProvider } from "@/hooks/useSport";
import Index from "./pages/Index";
import Fixtures from "./pages/Fixtures";
import Results from "./pages/Results";
import Ladder from "./pages/Ladder";
import Clubs from "./pages/Clubs";
import ClubProfile from "./pages/ClubProfile";
import MatchCentre from "./pages/MatchCentre";
import Login from "./pages/Login";
import Portal from "./pages/Portal";
import SubmitResult from "./pages/SubmitResult";
import SubmitCricketResult from "./pages/SubmitCricketResult";
import Admin from "./pages/Admin";
import ManageTeams from "./pages/ManageTeams";
import ManagePlayers from "./pages/ManagePlayers";
import Profile from "./pages/Profile";
import CoachHub from "./pages/CoachHub";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SportProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/fixtures" element={<Fixtures />} />
            <Route path="/results" element={<Results />} />
            <Route path="/ladder" element={<Ladder />} />
            <Route path="/clubs" element={<Clubs />} />
            <Route path="/clubs/:id" element={<ClubProfile />} />
            <Route path="/match/:id" element={<MatchCentre />} />
            <Route path="/login" element={<Login />} />
            <Route path="/portal" element={<Portal />} />
            <Route path="/portal/submit" element={<SubmitResult />} />
            <Route path="/portal/submit-cricket" element={<SubmitCricketResult />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/coach-hub" element={<CoachHub />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/teams" element={<ManageTeams />} />
            <Route path="/admin/players" element={<ManagePlayers />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </SportProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
