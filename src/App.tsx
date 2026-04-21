import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import Landing from "./pages/Landing";
import Triage from "./pages/Triage";
import TriageResult from "./pages/TriageResult";
import Doctors from "./pages/Doctors";
import Booking from "./pages/Booking";
import Appointments from "./pages/Appointments";
import Emergency from "./pages/Emergency";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/triage" element={<Triage />} />
            <Route path="/triage-result" element={<TriageResult />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/emergency" element={<Emergency />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
