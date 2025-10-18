import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Store, ShoppingCart, Package, Users, Truck, BarChart3, Settings, Tag, History, CreditCard, TrendingUp, Receipt } from 'lucide-react';
const sidebarItems = [{
  title: 'Dashboard',
  url: '/',
  icon: BarChart3
}, {
  title: 'PDV / Caixa',
  url: '/pdv',
  icon: ShoppingCart
}, {
  title: 'Produtos',
  url: '/produtos',
  icon: Package
}, {
  title: 'Clientes',
  url: '/clientes',
  icon: Users
}, {
  title: 'Fornecedores',
  url: '/fornecedores',
  icon: Truck
}, {
  title: 'Categorias',
  url: '/categorias',
  icon: Tag
}, {
  title: 'Estoque',
  url: '/estoque',
  icon: TrendingUp
}, {
  title: 'Vendas',
  url: '/vendas',
  icon: CreditCard
}, {
  title: 'Relatórios',
  url: '/relatorios',
  icon: History
}, {
  title: 'Despesas',
  url: '/despesas',
  icon: Receipt
}, {
  title: 'Configurações',
  url: '/configuracoes',
  icon: Settings
}];
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}
export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose
}) => {
  const location = useLocation();
  return <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      
      {/* Sidebar */}
      <aside className={cn('fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transition-transform duration-300 lg:translate-x-0 lg:z-auto flex-shrink-0', isOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center space-x-3 px-6 py-6 border-b border-border">
            <div className="bg-primary rounded-lg p-2">
              <Store className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">seeStore</h1>
              <p className="text-xs text-muted-foreground">Sistema de Gestão</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {sidebarItems.map(item => {
            const isActive = location.pathname === item.url;
            return <NavLink key={item.title} to={item.url} onClick={onClose} className={cn('flex items-center space-x-3 px-3 py-3 rounded-lg transition-smooth group', isActive ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground')}>
                  <item.icon className={cn('h-5 w-5 transition-smooth', isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-accent-foreground')} />
                  <span className="font-medium">{item.title}</span>
                </NavLink>;
          })}
          </nav>

          {/* Footer info */}
          <div className="px-6 py-4 border-t border-border">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span>Desenvolvido por</span>
              <img 
                src="https://seellbr.com/assets/images/logoblack.png" 
                alt="seeLL" 
                className="h-4 opacity-60 hover:opacity-100 transition-opacity"
              />
            </div>
          </div>
        </div>
      </aside>
    </>;
};