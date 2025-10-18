import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Package, 
  Plus, 
  Search, 
  ArrowUpDown, 
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface Produto {
  id: string;
  nome: string;
  codigo_interno: string;
  estoque_atual: number;
  estoque_minimo: number;
  preco_custo: number;
  preco_venda: number;
  categoria?: { nome: string };
}

interface MovimentacaoEstoque {
  id: string;
  tipo_movimentacao: 'entrada' | 'saida';
  quantidade: number;
  valor_unitario?: number;
  observacao?: string;
  created_at: string;
  produto?: { nome: string };
}

export default function Estoque() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMovimentacao, setShowMovimentacao] = useState(false);
  const [searchMovimentacao, setSearchMovimentacao] = useState('');
  const [produtoMovimentacao, setProdutoMovimentacao] = useState<Produto | null>(null);
  const [tipoMovimentacao, setTipoMovimentacao] = useState<'entrada' | 'saida'>('entrada');
  const [quantidade, setQuantidade] = useState<number>(0);
  const [valorUnitario, setValorUnitario] = useState<number>(0);
  const [observacao, setObservacao] = useState('');
  
  // Estados para receber mercadoria
  const [showReceberMercadoria, setShowReceberMercadoria] = useState(false);
  const [searchProduto, setSearchProduto] = useState('');
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [quantidadeReceber, setQuantidadeReceber] = useState<number>(0);
  const [valorCustoReceber, setValorCustoReceber] = useState<number>(0);
  const [observacaoReceber, setObservacaoReceber] = useState('');
  
  const { toast } = useToast();

  useEffect(() => {
    fetchProdutos();
    fetchMovimentacoes();
  }, []);

  const fetchProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select(`
          id,
          nome,
          codigo_interno,
          estoque_atual,
          estoque_minimo,
          preco_custo,
          preco_venda,
          categoria:categorias(nome)
        `)
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setProdutos(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar produtos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMovimentacoes = async () => {
    try {
      const { data, error } = await supabase
        .from('movimentacao_estoque')
        .select(`
          id,
          tipo_movimentacao,
          quantidade,
          valor_unitario,
          observacao,
          created_at,
          produto:produtos(nome)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setMovimentacoes((data || []) as MovimentacaoEstoque[]);
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error);
    }
  };

  const buscarProduto = () => {
    if (!searchProduto.trim()) return;
    
    const produto = produtos.find(p => 
      p.codigo_interno.toLowerCase().includes(searchProduto.toLowerCase()) ||
      p.nome.toLowerCase().includes(searchProduto.toLowerCase())
    );
    
    if (produto) {
      setProdutoSelecionado(produto);
      setValorCustoReceber(produto.preco_custo);
    } else {
      toast({
        title: "Produto não encontrado",
        description: "Nenhum produto encontrado com este código ou nome",
        variant: "destructive"
      });
    }
  };

  const confirmarRecebimento = async () => {
    if (!produtoSelecionado || !quantidadeReceber) {
      toast({
        title: "Erro",
        description: "Selecione um produto e informe a quantidade",
        variant: "destructive"
      });
      return;
    }

    try {
      // Inserir movimentação de entrada
      const { error: movError } = await supabase
        .from('movimentacao_estoque')
        .insert({
          produto_id: produtoSelecionado.id,
          tipo_movimentacao: 'entrada',
          quantidade: quantidadeReceber,
          valor_unitario: valorCustoReceber || null,
          observacao: observacaoReceber || 'Recebimento de mercadoria'
        });

      if (movError) throw movError;

      // Atualizar estoque do produto
      const novoEstoque = produtoSelecionado.estoque_atual + quantidadeReceber;
      
      const { error: updateError } = await supabase
        .from('produtos')
        .update({ 
          estoque_atual: novoEstoque,
          preco_custo: valorCustoReceber // Atualizar preço de custo se informado
        })
        .eq('id', produtoSelecionado.id);

      if (updateError) throw updateError;

      toast({
        title: "Sucesso",
        description: `Recebimento registrado: ${quantidadeReceber} unidades`,
      });

      // Resetar form
      setProdutoSelecionado(null);
      setSearchProduto('');
      setQuantidadeReceber(0);
      setValorCustoReceber(0);
      setObservacaoReceber('');
      setShowReceberMercadoria(false);

      // Recarregar dados
      fetchProdutos();
      fetchMovimentacoes();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao registrar recebimento",
        variant: "destructive"
      });
    }
  };

  const buscarProdutoMovimentacao = () => {
    if (!searchMovimentacao.trim()) return;
    
    const produto = produtos.find(p => 
      p.codigo_interno.toLowerCase().includes(searchMovimentacao.toLowerCase()) ||
      p.nome.toLowerCase().includes(searchMovimentacao.toLowerCase())
    );
    
    if (produto) {
      setProdutoMovimentacao(produto);
    } else {
      toast({
        title: "Produto não encontrado",
        description: "Nenhum produto encontrado com este código ou nome",
        variant: "destructive"
      });
    }
  };

  const handleMovimentacao = async () => {
    if (!produtoMovimentacao || !quantidade) {
      toast({
        title: "Erro",
        description: "Selecione um produto e informe a quantidade",
        variant: "destructive"
      });
      return;
    }

    try {
      // Inserir movimentação
      const { error: movError } = await supabase
        .from('movimentacao_estoque')
        .insert({
          produto_id: produtoMovimentacao.id,
          tipo_movimentacao: tipoMovimentacao,
          quantidade,
          valor_unitario: valorUnitario || null,
          observacao: observacao || null
        });

      if (movError) throw movError;

      // Atualizar estoque do produto
      const novoEstoque = tipoMovimentacao === 'entrada' 
        ? produtoMovimentacao.estoque_atual + quantidade
        : produtoMovimentacao.estoque_atual - quantidade;

      const { error: updateError } = await supabase
        .from('produtos')
        .update({ estoque_atual: novoEstoque })
        .eq('id', produtoMovimentacao.id);

      if (updateError) throw updateError;

      toast({
        title: "Sucesso",
        description: "Movimentação registrada com sucesso",
      });

      // Resetar form
      setProdutoMovimentacao(null);
      setSearchMovimentacao('');
      setQuantidade(0);
      setValorUnitario(0);
      setObservacao('');
      setShowMovimentacao(false);

      // Recarregar dados
      fetchProdutos();
      fetchMovimentacoes();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao registrar movimentação",
        variant: "destructive"
      });
    }
  };

  const filteredProdutos = produtos.filter(produto =>
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.codigo_interno.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const produtosBaixoEstoque = produtos.filter(p => p.estoque_atual <= p.estoque_minimo);
  const estoqueTotal = produtos.reduce((sum, p) => sum + (p.estoque_atual * p.preco_custo), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Controle de Estoque</h1>
          <p className="text-muted-foreground">Gerencie entradas e saídas de produtos</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showReceberMercadoria} onOpenChange={setShowReceberMercadoria}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Package className="w-4 h-4 mr-2" />
                Receber Mercadoria
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Receber Mercadoria</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite código ou nome do produto..."
                    value={searchProduto}
                    onChange={(e) => setSearchProduto(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        buscarProduto();
                      }
                    }}
                  />
                  <Button onClick={buscarProduto}>
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
                
                {produtoSelecionado && (
                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{produtoSelecionado.nome}</h3>
                        <p className="text-sm text-muted-foreground">Código: {produtoSelecionado.codigo_interno}</p>
                        <p className="text-sm text-muted-foreground">Estoque atual: {produtoSelecionado.estoque_atual}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="quantidade">Quantidade</Label>
                        <Input
                          type="number"
                          value={quantidadeReceber}
                          onChange={(e) => setQuantidadeReceber(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="valor_custo">Valor de Custo</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={valorCustoReceber}
                          onChange={(e) => setValorCustoReceber(Number(e.target.value))}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="observacao">Observação</Label>
                      <Textarea
                        value={observacaoReceber}
                        onChange={(e) => setObservacaoReceber(e.target.value)}
                        placeholder="Informações sobre o recebimento..."
                      />
                    </div>
                    
                    <Button onClick={confirmarRecebimento} className="w-full">
                      Confirmar Recebimento
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showMovimentacao} onOpenChange={setShowMovimentacao}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Movimentação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Registrar Movimentação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite código ou nome do produto..."
                    value={searchMovimentacao}
                    onChange={(e) => setSearchMovimentacao(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        buscarProdutoMovimentacao();
                      }
                    }}
                  />
                  <Button onClick={buscarProdutoMovimentacao}>
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
                
                {produtoMovimentacao && (
                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{produtoMovimentacao.nome}</h3>
                        <p className="text-sm text-muted-foreground">Código: {produtoMovimentacao.codigo_interno}</p>
                        <p className="text-sm text-muted-foreground">Estoque atual: {produtoMovimentacao.estoque_atual}</p>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="tipo">Tipo de Movimentação</Label>
                      <Select value={tipoMovimentacao} onValueChange={(value: 'entrada' | 'saida') => setTipoMovimentacao(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entrada">Entrada</SelectItem>
                          <SelectItem value="saida">Saída</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="quantidade">Quantidade</Label>
                        <Input
                          type="number"
                          value={quantidade}
                          onChange={(e) => setQuantidade(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="valor">Valor Unitário (opcional)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={valorUnitario}
                          onChange={(e) => setValorUnitario(Number(e.target.value))}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="observacao">Observação</Label>
                      <Textarea
                        value={observacao}
                        onChange={(e) => setObservacao(e.target.value)}
                        placeholder="Informações adicionais..."
                      />
                    </div>
                    
                    <Button onClick={handleMovimentacao} className="w-full">
                      Registrar Movimentação
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total em Estoque</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {estoqueTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">Baseado no preço de custo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Cadastrados</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{produtos.length}</div>
            <p className="text-xs text-muted-foreground">Total de produtos ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Baixo Estoque</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{produtosBaixoEstoque.length}</div>
            <p className="text-xs text-muted-foreground">Produtos no estoque mínimo</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtro */}
      <div className="flex items-center space-x-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou código..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Tabela de produtos */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos em Estoque</CardTitle>
          <CardDescription>Lista completa dos produtos e seus estoques</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Estoque Atual</TableHead>
                <TableHead className="text-right">Estoque Mínimo</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProdutos.map((produto) => (
                <TableRow key={produto.id}>
                  <TableCell className="font-medium">{produto.nome}</TableCell>
                  <TableCell>{produto.codigo_interno}</TableCell>
                  <TableCell>{produto.categoria?.nome || 'Sem categoria'}</TableCell>
                  <TableCell className="text-right">{produto.estoque_atual}</TableCell>
                  <TableCell className="text-right">{produto.estoque_minimo}</TableCell>
                  <TableCell className="text-right">
                    {produto.estoque_atual <= produto.estoque_minimo ? (
                      <Badge variant="destructive">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Baixo
                      </Badge>
                    ) : produto.estoque_atual <= produto.estoque_minimo * 2 ? (
                      <Badge variant="secondary">
                        <ArrowUpDown className="w-3 h-3 mr-1" />
                        Atenção
                      </Badge>
                    ) : (
                      <Badge className="bg-success text-success-foreground">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Normal
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Movimentações recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentações Recentes</CardTitle>
          <CardDescription>Últimas 50 movimentações de estoque</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead>Observação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movimentacoes.map((mov) => (
                <TableRow key={mov.id}>
                  <TableCell>{new Date(mov.created_at).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{mov.produto?.nome}</TableCell>
                  <TableCell>
                    <Badge variant={mov.tipo_movimentacao === 'entrada' ? 'default' : 'secondary'}>
                      {mov.tipo_movimentacao === 'entrada' ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {mov.tipo_movimentacao}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{mov.quantidade}</TableCell>
                  <TableCell>{mov.observacao || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}