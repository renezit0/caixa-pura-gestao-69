import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  TrendingUp,
  Users,
  AlertTriangle,
  BarChart3,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalVendas: number;
  vendasHoje: number;
  produtosCadastrados: number;
  produtosBaixoEstoque: number;
  clientes: number;
  valorTotalEstoque: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalVendas: 0,
    vendasHoje: 0,
    produtosCadastrados: 0,
    produtosBaixoEstoque: 0,
    clientes: 0,
    valorTotalEstoque: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Buscar dados das vendas
      const { data: vendas } = await supabase
        .from('vendas')
        .select('total, created_at');

      // Buscar produtos
      const { data: produtos } = await supabase
        .from('produtos')
        .select('id, estoque_atual, estoque_minimo, preco_venda')
        .eq('ativo', true);

      // Buscar clientes
      const { data: clientes } = await supabase
        .from('clientes')
        .select('id')
        .eq('ativo', true);

      const hoje = new Date().toISOString().split('T')[0];
      const vendasHoje = vendas?.filter(v => v.created_at.startsWith(hoje)) || [];
      const produtosBaixoEstoque = produtos?.filter(p => p.estoque_atual <= p.estoque_minimo) || [];
      
      const valorTotalEstoque = produtos?.reduce((acc, p) => 
        acc + (p.estoque_atual * p.preco_venda), 0) || 0;

      setStats({
        totalVendas: vendas?.reduce((acc, v) => acc + v.total, 0) || 0,
        vendasHoje: vendasHoje.reduce((acc, v) => acc + v.total, 0),
        produtosCadastrados: produtos?.length || 0,
        produtosBaixoEstoque: produtosBaixoEstoque.length,
        clientes: clientes?.length || 0,
        valorTotalEstoque,
      });
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1 lg:mt-2 text-sm lg:text-base">
            Visão geral do seu negócio em tempo real
          </p>
        </div>
        <div className="flex space-x-2 w-full lg:w-auto">
          <Button onClick={() => navigate('/pdv')} variant="hero" size="lg" className="flex-1 lg:flex-none">
            <ShoppingCart className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
            Abrir PDV
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {stats.produtosBaixoEstoque > 0 && (
        <Card className="border-warning bg-warning-light">
          <CardContent className="flex items-center space-x-4 p-4">
            <AlertTriangle className="h-6 w-6 text-warning" />
            <div>
              <h3 className="font-medium">Atenção: Produtos com estoque baixo</h3>
              <p className="text-sm text-muted-foreground">
                {stats.produtosBaixoEstoque} produtos precisam de reposição
              </p>
            </div>
            <Button variant="warning" size="sm" onClick={() => navigate('/estoque')}>
              Ver Estoque
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Cards de estatísticas */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="card-gradient">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold currency text-success">
              {formatCurrency(stats.vendasHoje)}
            </div>
            <p className="text-xs text-muted-foreground">
              +12% em relação a ontem
            </p>
          </CardContent>
        </Card>

        <Card className="card-gradient">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold currency">
              {formatCurrency(stats.totalVendas)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total acumulado
            </p>
          </CardContent>
        </Card>

        <Card className="card-gradient">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.produtosCadastrados}
            </div>
            <p className="text-xs text-muted-foreground">
              Produtos cadastrados
            </p>
          </CardContent>
        </Card>

        <Card className="card-gradient">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.clientes}
            </div>
            <p className="text-xs text-muted-foreground">
              Clientes cadastrados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cards de ações rápidas */}
      <div className="grid gap-4 lg:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card className="card-gradient hover:shadow-lg transition-smooth">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <span>Ponto de Venda</span>
            </CardTitle>
            <CardDescription>
              Abrir o sistema de PDV para realizar vendas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/pdv')} variant="pdv" className="w-full">
              Abrir Caixa
            </Button>
          </CardContent>
        </Card>

        <Card className="card-gradient hover:shadow-lg transition-smooth">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-success" />
              <span>Estoque</span>
            </CardTitle>
            <CardDescription>
              Gerenciar produtos e controle de estoque
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Valor em estoque:</span>
              <span className="font-semibold currency">
                {formatCurrency(stats.valorTotalEstoque)}
              </span>
            </div>
            <Button onClick={() => navigate('/estoque')} variant="success" className="w-full">
              Gerenciar Estoque
            </Button>
          </CardContent>
        </Card>

        <Card className="card-gradient hover:shadow-lg transition-smooth">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-warning" />
              <span>Relatórios</span>
            </CardTitle>
            <CardDescription>
              Visualizar relatórios e análises de vendas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/relatorios')} variant="warning" className="w-full">
              Ver Relatórios
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Atividade recente */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            Atividade Recente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-success-light rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="bg-success rounded-full p-2">
                <ShoppingCart className="h-4 w-4 text-success-foreground" />
              </div>
              <div>
                <p className="font-medium">Nova venda realizada</p>
                <p className="text-sm text-muted-foreground">2 produtos vendidos</p>
              </div>
            </div>
            <Badge variant="outline" className="text-success border-success">
              Há 5 min
            </Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="bg-primary rounded-full p-2">
                <Package className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <p className="font-medium">Produto cadastrado</p>
                <p className="text-sm text-muted-foreground">Novo produto adicionado</p>
              </div>
            </div>
            <Badge variant="outline">
              Há 1h
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;