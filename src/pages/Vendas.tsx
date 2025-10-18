import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { 
  ShoppingCart, 
  Search, 
  Eye,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  Package
} from 'lucide-react';

interface Venda {
  id: string;
  numero_venda: number;
  created_at: string;
  subtotal: number;
  desconto: number;
  total: number;
  forma_pagamento: string;
  status: string;
  cliente?: { nome: string };
  itens_venda: Array<{
    quantidade: number;
    preco_unitario: number;
    subtotal: number;
    produto: { nome: string };
  }>;
}

export default function Vendas() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVenda, setSelectedVenda] = useState<Venda | null>(null);
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroData, setFiltroData] = useState<string>('hoje');
  const { toast } = useToast();

  const getDataInicio = () => {
    if (filtroData === 'hoje') {
      return new Date().toISOString().split('T')[0];
    } else if (filtroData === 'semana') {
      const semanaAtras = new Date();
      semanaAtras.setDate(semanaAtras.getDate() - 7);
      return semanaAtras.toISOString();
    } else if (filtroData === 'mes') {
      const mesAtras = new Date();
      mesAtras.setMonth(mesAtras.getMonth() - 1);
      return mesAtras.toISOString();
    }
    return '';
  };

  const { data: vendas = [], isLoading: loading } = useSupabaseQuery<Venda>(
    ['vendas', filtroData, filtroStatus],
    async () => {
      let query = supabase
        .from('vendas')
        .select(`
          id,
          numero_venda,
          created_at,
          subtotal,
          desconto,
          total,
          forma_pagamento,
          status,
          cliente:clientes(nome),
          itens_venda(
            quantidade,
            preco_unitario,
            subtotal,
            produto:produtos(nome)
          )
        `)
        .order('created_at', { ascending: false });

      const dataInicio = getDataInicio();
      if (dataInicio) {
        query = query.gte('created_at', dataInicio);
      }

      if (filtroStatus !== 'todos') {
        query = query.eq('status', filtroStatus);
      }

      return query;
    }
  );

  const filteredVendas = vendas.filter(venda =>
    venda.numero_venda.toString().includes(searchTerm) ||
    venda.cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venda.forma_pagamento?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculando estatísticas
  const totalVendas = filteredVendas.length;
  const totalFaturamento = filteredVendas.reduce((sum, venda) => sum + venda.total, 0);
  const ticketMedio = totalVendas > 0 ? totalFaturamento / totalVendas : 0;
  const vendasHoje = vendas.filter(v => {
    const hoje = new Date().toISOString().split('T')[0];
    return v.created_at.startsWith(hoje);
  }).length;

  const handleVerDetalhes = (venda: Venda) => {
    setSelectedVenda(venda);
    setShowDetalhes(true);
  };

  return (
    <div className="space-y-4 lg:space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Vendas</h1>
          <p className="text-muted-foreground text-sm lg:text-base">Acompanhe as vendas e faturamento</p>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendasHoje}</div>
            <p className="text-xs text-muted-foreground">Vendas realizadas hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVendas}</div>
            <p className="text-xs text-muted-foreground">No período selecionado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">Total no período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">Por venda</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center space-x-2 flex-1">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número, cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={filtroData} onValueChange={setFiltroData}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hoje">Hoje</SelectItem>
            <SelectItem value="semana">Última semana</SelectItem>
            <SelectItem value="mes">Último mês</SelectItem>
            <SelectItem value="todos">Todos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos status</SelectItem>
            <SelectItem value="finalizada">Finalizadas</SelectItem>
            <SelectItem value="cancelada">Canceladas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela de vendas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Vendas</CardTitle>
          <CardDescription>Histórico completo das vendas realizadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Número</TableHead>
                  <TableHead className="whitespace-nowrap">Data/Hora</TableHead>
                  <TableHead className="whitespace-nowrap hidden md:table-cell">Cliente</TableHead>
                  <TableHead className="whitespace-nowrap hidden lg:table-cell">Pagamento</TableHead>
                  <TableHead className="text-right whitespace-nowrap hidden lg:table-cell">Subtotal</TableHead>
                  <TableHead className="text-right whitespace-nowrap hidden lg:table-cell">Desconto</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Total</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Ações</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {filteredVendas.map((venda) => (
                <TableRow key={venda.id}>
                  <TableCell className="font-medium whitespace-nowrap">#{venda.numero_venda}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs lg:text-sm">
                    {new Date(venda.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{venda.cliente?.nome || 'Não informado'}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge variant="outline" className="text-xs">
                      {venda.forma_pagamento || 'Não informado'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right hidden lg:table-cell text-xs lg:text-sm">
                    R$ {venda.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right hidden lg:table-cell text-xs lg:text-sm">
                    R$ {venda.desconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right font-medium whitespace-nowrap text-xs lg:text-sm">
                    R$ {venda.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={venda.status === 'finalizada' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {venda.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVerDetalhes(venda)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de detalhes da venda */}
      <Dialog open={showDetalhes} onOpenChange={setShowDetalhes}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Venda #{selectedVenda?.numero_venda}</DialogTitle>
          </DialogHeader>
          {selectedVenda && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Data:</strong> {new Date(selectedVenda.created_at).toLocaleDateString('pt-BR')}
                </div>
                <div>
                  <strong>Cliente:</strong> {selectedVenda.cliente?.nome || 'Não informado'}
                </div>
                <div>
                  <strong>Forma de Pagamento:</strong> {selectedVenda.forma_pagamento || 'Não informado'}
                </div>
                <div>
                  <strong>Status:</strong> 
                  <Badge className="ml-2" variant={selectedVenda.status === 'finalizada' ? 'default' : 'destructive'}>
                    {selectedVenda.status}
                  </Badge>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Itens da Venda</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Preço Unit.</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedVenda.itens_venda.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.produto.nome}</TableCell>
                        <TableCell className="text-right">{item.quantidade}</TableCell>
                        <TableCell className="text-right">
                          R$ {item.preco_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {item.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>R$ {selectedVenda.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Desconto:</span>
                    <span>R$ {selectedVenda.desconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>R$ {selectedVenda.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}