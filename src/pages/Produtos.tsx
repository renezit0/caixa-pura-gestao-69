import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  DollarSign,
  Barcode
} from 'lucide-react';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Produto {
  id: string;
  nome: string;
  codigo_interno: string;
  codigo_barras?: string;
  descricao?: string;
  preco_custo: number;
  preco_venda: number;
  estoque_atual: number;
  estoque_minimo: number;
  unidade_medida: string;
  categoria_id?: string;
  fornecedor_id?: string;
  ativo: boolean;
  imagem_url?: string;
}

interface Categoria {
  id: string;
  nome: string;
}

interface Fornecedor {
  id: string;
  nome: string;
}

const Produtos = () => {
  const { toast } = useToast();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Produto>>({});
  const [loading, setLoading] = useState(false);
  const [exibirProdutosTemporarios, setExibirProdutosTemporarios] = useState(false);

  useEffect(() => {
    loadConfiguracoes();
    loadCategorias();
    loadFornecedores();
  }, []);

  useEffect(() => {
    // Só carrega produtos depois que a configuração foi carregada
    if (exibirProdutosTemporarios !== undefined) {
      loadProdutos();
    }
  }, [exibirProdutosTemporarios]);

  const loadConfiguracoes = async () => {
    const { data } = await supabase
      .from('configuracoes')
      .select('*')
      .eq('chave', 'exibir_produtos_temporarios')
      .maybeSingle();

    if (data) {
      setExibirProdutosTemporarios(data.valor);
    }
  };

  const loadProdutos = async () => {
    setLoading(true);
    let query = supabase
      .from('produtos')
      .select('*');

    // Filtrar produtos temporários se a configuração estiver desabilitada
    if (!exibirProdutosTemporarios) {
      query = query.eq('produto_temporario', false);
    }

    const { data, error } = await query.order('nome');
      
    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar produtos",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }
    
    setProdutos(data || []);
    setLoading(false);
  };

  const loadCategorias = async () => {
    const { data } = await supabase
      .from('categorias')
      .select('id, nome')
      .eq('ativo', true)
      .order('nome');
    setCategorias(data || []);
  };

  const loadFornecedores = async () => {
    const { data } = await supabase
      .from('fornecedores')
      .select('id, nome')
      .eq('ativo', true)
      .order('nome');
    setFornecedores(data || []);
  };

  const handleSave = async () => {
    if (!currentProduct.nome || !currentProduct.preco_venda) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e preço de venda são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const productData = {
        nome: currentProduct.nome,
        codigo_barras: currentProduct.codigo_barras || null,
        descricao: currentProduct.descricao || null,
        preco_custo: currentProduct.preco_custo || 0,
        preco_venda: currentProduct.preco_venda,
        estoque_atual: currentProduct.estoque_atual || 0,
        estoque_minimo: currentProduct.estoque_minimo || 0,
        unidade_medida: currentProduct.unidade_medida || 'UN',
        categoria_id: currentProduct.categoria_id || null,
        fornecedor_id: currentProduct.fornecedor_id || null,
        ativo: currentProduct.ativo !== false,
        imagem_url: currentProduct.imagem_url || null,
      };

      if (isEditing && currentProduct.id) {
        const { error } = await supabase
          .from('produtos')
          .update(productData)
          .eq('id', currentProduct.id);

        if (error) throw error;

        toast({
          title: "Produto atualizado!",
          description: "Produto atualizado com sucesso",
        });
      } else {
        // Para novo produto, incluímos um código temporário que será substituído pelo trigger
        const insertData = {
          ...productData,
          codigo_interno: 'TEMP' + Date.now() // Será substituído pelo trigger
        };
        
        const { error } = await supabase
          .from('produtos')
          .insert(insertData);

        if (error) throw error;

        toast({
          title: "Produto cadastrado!",
          description: "Produto cadastrado com sucesso",
        });
      }

      loadProdutos();
      handleCloseDialog();

    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar produto",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (produto: Produto) => {
    setCurrentProduct(produto);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    const { error } = await supabase
      .from('produtos')
      .update({ ativo: false })
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir produto",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Produto excluído",
      description: "Produto excluído com sucesso",
    });

    loadProdutos();
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setIsEditing(false);
    setCurrentProduct({});
  };

  const filteredProdutos = produtos.filter(produto =>
    produto.ativo && (
      produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.codigo_interno.includes(searchTerm) ||
      produto.codigo_barras?.includes(searchTerm)
    )
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getCategoriaName = (id?: string) => {
    return categorias.find(c => c.id === id)?.nome || '-';
  };

  const getFornecedorName = (id?: string) => {
    return fornecedores.find(f => f.id === id)?.nome || '-';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Produtos</h1>
          <p className="text-muted-foreground">Gerencie seu catálogo de produtos</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setCurrentProduct({});
              setIsEditing(false);
            }} className="hero-gradient glow-effect">
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? 'Editar Produto' : 'Novo Produto'}
              </DialogTitle>
              <DialogDescription>
                {isEditing ? 'Edite as informações do produto' : 'Cadastre um novo produto no sistema'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Produto *</Label>
                <Input
                  id="nome"
                  value={currentProduct.nome || ''}
                  onChange={(e) => setCurrentProduct({...currentProduct, nome: e.target.value})}
                  placeholder="Digite o nome do produto"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigo_barras">Código de Barras</Label>
                <Input
                  id="codigo_barras"
                  value={currentProduct.codigo_barras || ''}
                  onChange={(e) => setCurrentProduct({...currentProduct, codigo_barras: e.target.value})}
                  placeholder="Código de barras"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={currentProduct.descricao || ''}
                  onChange={(e) => setCurrentProduct({...currentProduct, descricao: e.target.value})}
                  placeholder="Descrição detalhada do produto"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preco_custo">Preço de Custo</Label>
                <Input
                  id="preco_custo"
                  type="number"
                  step="0.01"
                  value={currentProduct.preco_custo || ''}
                  onChange={(e) => setCurrentProduct({...currentProduct, preco_custo: parseFloat(e.target.value) || 0})}
                  placeholder="0,00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preco_venda">Preço de Venda *</Label>
                <Input
                  id="preco_venda"
                  type="number"
                  step="0.01"
                  value={currentProduct.preco_venda || ''}
                  onChange={(e) => setCurrentProduct({...currentProduct, preco_venda: parseFloat(e.target.value) || 0})}
                  placeholder="0,00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estoque_atual">Estoque Atual</Label>
                <Input
                  id="estoque_atual"
                  type="number"
                  value={currentProduct.estoque_atual || ''}
                  onChange={(e) => setCurrentProduct({...currentProduct, estoque_atual: parseInt(e.target.value) || 0})}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estoque_minimo">Estoque Mínimo</Label>
                <Input
                  id="estoque_minimo"
                  type="number"
                  value={currentProduct.estoque_minimo || ''}
                  onChange={(e) => setCurrentProduct({...currentProduct, estoque_minimo: parseInt(e.target.value) || 0})}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unidade_medida">Unidade de Medida</Label>
                <Select
                  value={currentProduct.unidade_medida || 'UN'}
                  onValueChange={(value) => setCurrentProduct({...currentProduct, unidade_medida: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UN">Unidade</SelectItem>
                    <SelectItem value="KG">Quilograma</SelectItem>
                    <SelectItem value="G">Grama</SelectItem>
                    <SelectItem value="L">Litro</SelectItem>
                    <SelectItem value="ML">Mililitro</SelectItem>
                    <SelectItem value="M">Metro</SelectItem>
                    <SelectItem value="CM">Centímetro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Select
                  value={currentProduct.categoria_id || 'sem-categoria'}
                  onValueChange={(value) => setCurrentProduct({...currentProduct, categoria_id: value === 'sem-categoria' ? null : value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sem-categoria">Sem categoria</SelectItem>
                    {categorias.map((categoria) => (
                      <SelectItem key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fornecedor">Fornecedor</Label>
                <Select
                  value={currentProduct.fornecedor_id || 'sem-fornecedor'}
                  onValueChange={(value) => setCurrentProduct({...currentProduct, fornecedor_id: value === 'sem-fornecedor' ? null : value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sem-fornecedor">Sem fornecedor</SelectItem>
                    {fornecedores.map((fornecedor) => (
                      <SelectItem key={fornecedor.id} value={fornecedor.id}>
                        {fornecedor.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="imagem_url">URL da Imagem</Label>
                <Input
                  id="imagem_url"
                  value={currentProduct.imagem_url || ''}
                  onChange={(e) => setCurrentProduct({...currentProduct, imagem_url: e.target.value})}
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card className="card-gradient">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, código interno ou código de barras..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Produtos */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Lista de Produtos ({filteredProdutos.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableSkeleton rows={5} columns={6} />
                ) : filteredProdutos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold">Nenhum produto encontrado</h3>
                      <p className="text-muted-foreground">
                        {searchTerm ? 'Tente ajustar os filtros de pesquisa' : 'Comece adicionando um novo produto'}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProdutos.map((produto) => (
                    <TableRow key={produto.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          {produto.imagem_url ? (
                            <img 
                              src={produto.imagem_url} 
                              alt={produto.nome}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{produto.nome}</p>
                            <p className="text-sm text-muted-foreground">{produto.unidade_medida}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-mono">{produto.codigo_interno}</p>
                          {produto.codigo_barras && (
                            <p className="text-xs text-muted-foreground font-mono">{produto.codigo_barras}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getCategoriaName(produto.categoria_id)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold currency">{formatCurrency(produto.preco_venda)}</p>
                          {produto.preco_custo > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Custo: {formatCurrency(produto.preco_custo)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className={`font-semibold ${produto.estoque_atual <= produto.estoque_minimo ? 'text-warning' : 'text-foreground'}`}>
                            {produto.estoque_atual}
                          </span>
                          {produto.estoque_atual <= produto.estoque_minimo && (
                            <AlertTriangle className="h-4 w-4 text-warning" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={produto.ativo ? "default" : "destructive"}>
                          {produto.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(produto)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(produto.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Produtos;