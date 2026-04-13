import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import Index from "./pages/Index";
import StockPage from "./pages/StockPage";
import StockItemDetailPage from "./pages/StockItemDetailPage";
import StockItemEditPage from "./pages/StockItemEditPage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import ProductEditPage from "./pages/ProductEditPage";
import AssemblyPage from "./pages/AssemblyPage";
import AssemblyDetailPage from "./pages/AssemblyDetailPage";
import AssemblyEditPage from "./pages/AssemblyEditPage";
import ShoppingListPage from "./pages/ShoppingListPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <WorkspaceProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/stock" element={<StockPage />} />
            <Route path="/stock/new/edit" element={<StockItemEditPage />} />
            <Route path="/stock/:id" element={<StockItemDetailPage />} />
            <Route path="/stock/:id/edit" element={<StockItemEditPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/new/edit" element={<ProductEditPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/products/:id/edit" element={<ProductEditPage />} />
            <Route path="/assembly" element={<AssemblyPage />} />
            <Route path="/assembly/new/edit" element={<AssemblyEditPage />} />
            <Route path="/assembly/:id" element={<AssemblyDetailPage />} />
            <Route path="/assembly/:id/edit" element={<AssemblyEditPage />} />
            <Route path="/shopping" element={<ShoppingListPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </WorkspaceProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
