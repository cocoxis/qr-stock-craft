import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";

// Each page is loaded on demand to keep the initial bundle small
const Index = lazy(() => import("./pages/Index"));
const StockPage = lazy(() => import("./pages/StockPage"));
const StockItemDetailPage = lazy(() => import("./pages/StockItemDetailPage"));
const StockItemEditPage = lazy(() => import("./pages/StockItemEditPage"));
const ShoppingListPage = lazy(() => import("./pages/ShoppingListPage"));
const LabelsPage = lazy(() => import("./pages/LabelsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data stays fresh for 1 min: no refetch on every page change
      staleTime: 60_000,
      gcTime: 30 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PageFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <WorkspaceProvider>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/stock" element={<StockPage />} />
              <Route path="/stock/new/edit" element={<StockItemEditPage />} />
              <Route path="/stock/:id" element={<StockItemDetailPage />} />
              <Route path="/stock/:id/edit" element={<StockItemEditPage />} />
              <Route path="/labels" element={<LabelsPage />} />
              <Route path="/shopping" element={<ShoppingListPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </WorkspaceProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
