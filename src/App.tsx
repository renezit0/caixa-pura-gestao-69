import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { MainLayout } from "./components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import PDV from "./pages/PDV";
import Produtos from "./pages/Produtos";
import Clientes from "./pages/Clientes";
import Fornecedores from "./pages/Fornecedores";
import Categorias from "./pages/Categorias";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/*" element={
              <ProtectedRoute>
                <MainLayout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/pdv" element={<PDV />} />
                      <Route path="/produtos" element={<Produtos />} />
                      <Route path="/clientes" element={<Clientes />} />
                      <Route path="/fornecedores" element={<Fornecedores />} />
                      <Route path="/categorias" element={<Categorias />} />
                      <Route path="/estoque" element={<div className="p-8 text-center"><h1 className="text-2xl">Estoque - Em desenvolvimento</h1></div>} />
                      <Route path="/vendas" element={<div className="p-8 text-center"><h1 className="text-2xl">Vendas - Em desenvolvimento</h1></div>} />
                      <Route path="/relatorios" element={<div className="p-8 text-center"><h1 className="text-2xl">Relatórios - Em desenvolvimento</h1></div>} />
                      <Route path="/configuracoes" element={<div className="p-8 text-center"><h1 className="text-2xl">Configurações - Em desenvolvimento</h1></div>} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                </MainLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
