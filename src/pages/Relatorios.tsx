import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign,
  Package,
  Users,
  Calendar,
  Download,
  Eye
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface RelatorioVendas {
  data: string;
  total_vendas: number;
  quantidade_vendas: number;
  ticket_medio: number;
}

interface ProdutoMaisVendido {
  produto_nome: string;
  quantidade_total: number;
  faturamento_total: number;
}

export default function Relatorios() {
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<string>('7');
  const [considerarDespesas, setConsiderarDespesas] = useState(false);
  const [vendasPorDia, setVendasPorDia] = useState<RelatorioVendas[]>([]);
  const [produtosMaisVendidos, setProdutosMaisVendidos] = useState<ProdutoMaisVendido[]>([]);
  const [resumoGeral, setResumoGeral] = useState({
    totalVendas: 0,
    faturamentoTotal: 0,
    ticketMedio: 0,
    custoMedio: 0,
    faturamentoMedio: 0,
    lucroMedio: 0,
    lucroTotal: 0,
    totalProdutos: 0,
    totalClientes: 0,
    produtosBaixoEstoque: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchRelatorios();
  }, [periodo, considerarDespesas]);

  const fetchRelatorios = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchVendasPorDia(),
        fetchProdutosMaisVendidos(),
        fetchResumoGeral()
      ]);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar relatórios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVendasPorDia = async () => {
    try {
      const diasAtras = parseInt(periodo);
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - diasAtras);
      dataInicio.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('vendas')
        .select('created_at, total')
        .gte('created_at', dataInicio.toISOString())
        .eq('status', 'finalizada');

      if (error) throw error;

      // Agrupar por dia
      const vendasPorDia = data.reduce((acc: any, venda: any) => {
        const dataVenda = new Date(venda.created_at);
        const dataLocal = new Date(dataVenda.getTime() - (dataVenda.getTimezoneOffset() * 60000));
        const dataString = dataLocal.toISOString().split('T')[0];
        
        if (!acc[dataString]) {
          acc[dataString] = {
            data: dataString,
            total_vendas: 0,
            quantidade_vendas: 0
          };
        }
        acc[dataString].total_vendas += venda.total;
        acc[dataString].quantidade_vendas += 1;
        return acc;
      }, {});

      const resultado = Object.values(vendasPorDia).map((dia: any) => ({
        ...dia,
        ticket_medio: dia.quantidade_vendas > 0 ? dia.total_vendas / dia.quantidade_vendas : 0,
        data: new Date(dia.data + 'T12:00:00').toLocaleDateString('pt-BR')
      }));

      setVendasPorDia(resultado);
    } catch (error) {
      console.error('Erro ao buscar vendas por dia:', error);
    }
  };

  const fetchProdutosMaisVendidos = async () => {
    try {
      const diasAtras = parseInt(periodo);
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - diasAtras);
      dataInicio.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('itens_venda')
        .select(`
          quantidade,
          preco_unitario,
          produto:produtos(nome),
          venda:vendas!inner(created_at, status)
        `)
        .gte('venda.created_at', dataInicio.toISOString())
        .eq('venda.status', 'finalizada');

      if (error) throw error;

      // Agrupar por produto
      const produtosAgrupados = data.reduce((acc: any, item: any) => {
        const nomeProduto = item.produto?.nome || 'Produto não encontrado';
        if (!acc[nomeProduto]) {
          acc[nomeProduto] = {
            produto_nome: nomeProduto,
            quantidade_total: 0,
            faturamento_total: 0
          };
        }
        acc[nomeProduto].quantidade_total += item.quantidade;
        acc[nomeProduto].faturamento_total += item.quantidade * item.preco_unitario;
        return acc;
      }, {});

      const resultado = Object.values(produtosAgrupados)
        .sort((a: any, b: any) => b.quantidade_total - a.quantidade_total)
        .slice(0, 10) as ProdutoMaisVendido[];

      setProdutosMaisVendidos(resultado);
    } catch (error) {
      console.error('Erro ao buscar produtos mais vendidos:', error);
    }
  };

  const fetchResumoGeral = async () => {
    try {
      const diasAtras = parseInt(periodo);
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - diasAtras);
      dataInicio.setHours(0, 0, 0, 0);

      // Buscar vendas do período
      const { data: vendas, error: vendasError } = await supabase
        .from('vendas')
        .select('total')
        .gte('created_at', dataInicio.toISOString())
        .eq('status', 'finalizada');

      if (vendasError) throw vendasError;

      // Buscar itens vendidos com preço de custo
      const { data: itensVendidos, error: itensError } = await supabase
        .from('itens_venda')
        .select(`
          quantidade,
          preco_unitario,
          produto:produtos!inner(preco_custo),
          venda:vendas!inner(created_at, status)
        `)
        .gte('venda.created_at', dataInicio.toISOString())
        .eq('venda.status', 'finalizada');

      if (itensError) throw itensError;

      // Calcular custos e lucros
      let custoTotal = 0;
      let quantidadeItens = 0;
      
      itensVendidos?.forEach((item: any) => {
        const custoItem = (item.produto?.preco_custo || 0) * item.quantidade;
        custoTotal += custoItem;
        quantidadeItens += item.quantidade;
      });

      // Buscar contagem de produtos
      const { count: totalProdutos, error: produtosError } = await supabase
        .from('produtos')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true);

      if (produtosError) throw produtosError;

      // Buscar contagem de clientes
      const { count: totalClientes, error: clientesError } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true);

      if (clientesError) throw clientesError;

      // Buscar produtos com baixo estoque
      const { data: produtosBaixoEstoque, error: estoqueError } = await supabase
        .from('produtos')
        .select('id, estoque_atual, estoque_minimo')
        .eq('ativo', true)
        .eq('produto_temporario', false);

      if (estoqueError) throw estoqueError;

      // Filtrar produtos com baixo estoque no lado cliente
      const produtosBaixoEstoqueFiltrados = produtosBaixoEstoque?.filter(
        produto => produto.estoque_atual <= produto.estoque_minimo
      ) || [];

      const totalVendas = vendas.length;
      const faturamentoTotal = vendas.reduce((sum, venda) => sum + venda.total, 0);
      const ticketMedio = totalVendas > 0 ? faturamentoTotal / totalVendas : 0;
      const custoMedio = quantidadeItens > 0 ? custoTotal / quantidadeItens : 0;
      const faturamentoMedio = quantidadeItens > 0 ? faturamentoTotal / quantidadeItens : 0;
      let lucroTotal = faturamentoTotal - custoTotal;
      
      // Buscar despesas se habilitado
      let totalDespesas = 0;
      if (considerarDespesas) {
        const { data: despesas, error: despesasError } = await supabase
          .from('despesas')
          .select('valor')
          .gte('data_despesa', dataInicio.toISOString());

        if (!despesasError && despesas) {
          totalDespesas = despesas.reduce((sum, d) => sum + d.valor, 0);
          lucroTotal = lucroTotal - totalDespesas;
        }
      }
      
      const lucroMedio = totalVendas > 0 ? lucroTotal / totalVendas : 0;

      setResumoGeral({
        totalVendas,
        faturamentoTotal,
        ticketMedio,
        custoMedio,
        faturamentoMedio,
        lucroMedio,
        lucroTotal,
        totalProdutos: totalProdutos || 0,
        totalClientes: totalClientes || 0,
        produtosBaixoEstoque: produtosBaixoEstoqueFiltrados.length
      });
    } catch (error) {
      console.error('Erro ao buscar resumo geral:', error);
    }
  };

  const cores = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground text-sm lg:text-base">Análises e insights do negócio</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="considerarDespesas"
              checked={considerarDespesas}
              onChange={(e) => setConsiderarDespesas(e.target.checked)}
              className="rounded border-input"
            />
            <Label htmlFor="considerarDespesas" className="text-sm cursor-pointer">
              Considerar despesas
            </Label>
          </div>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="15">Últimos 15 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumoGeral.totalVendas}</div>
            <p className="text-xs text-muted-foreground">No período selecionado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {resumoGeral.faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Total do período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              R$ {resumoGeral.lucroTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Total do período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {resumoGeral.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Por venda</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              R$ {resumoGeral.lucroMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Por venda</p>
          </CardContent>
        </Card>
      </div>

      {/* Cards secundários */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Médio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {resumoGeral.custoMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Por item vendido</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Médio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {resumoGeral.faturamentoMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Por item vendido</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumoGeral.totalProdutos}</div>
            <p className="text-xs text-muted-foreground">Cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumoGeral.totalClientes}</div>
            <p className="text-xs text-muted-foreground">Cadastrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas por dia */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Dia</CardTitle>
            <CardDescription>Evolução das vendas no período</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vendasPorDia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'total_vendas' ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : value,
                    name === 'total_vendas' ? 'Faturamento' : 'Quantidade'
                  ]}
                />
                <Bar dataKey="total_vendas" fill="#3b82f6" name="Faturamento" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ticket médio por dia */}
        <Card>
          <CardHeader>
            <CardTitle>Ticket Médio por Dia</CardTitle>
            <CardDescription>Evolução do ticket médio</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={vendasPorDia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Ticket Médio']}
                />
                <Line type="monotone" dataKey="ticket_medio" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Produtos mais vendidos */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos Mais Vendidos</CardTitle>
          <CardDescription>Top 10 produtos por quantidade vendida no período</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Posição</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Quantidade Vendida</TableHead>
                <TableHead className="text-right">Faturamento</TableHead>
                <TableHead className="text-right">Participação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtosMaisVendidos.map((produto, index) => {
                const totalQuantidade = produtosMaisVendidos.reduce((sum, p) => sum + p.quantidade_total, 0);
                const participacao = totalQuantidade > 0 ? (produto.quantidade_total / totalQuantidade) * 100 : 0;
                
                return (
                  <TableRow key={produto.produto_nome}>
                    <TableCell>
                      <Badge variant={index < 3 ? 'default' : 'secondary'}>
                        {index + 1}º
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{produto.produto_nome}</TableCell>
                    <TableCell className="text-right">{produto.quantidade_total}</TableCell>
                    <TableCell className="text-right">
                      R$ {produto.faturamento_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      {participacao.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}