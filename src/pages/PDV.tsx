import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthContext'; // Add this import
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Search,
  DollarSign,
  User,
  Percent,
  Calculator,
  CreditCard,
  Banknote
} from 'lucide-react';
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

interface Product {
  id: string;
  nome: string;
  codigo_interno: string;
  codigo_barras?: string;
  preco_venda: number;
  estoque_atual: number;
}

interface CartItem extends Product {
  quantidade: number;
  subtotal: number;
}

interface Cliente {
  id: string;
  nome: string;
  cpf?: string;
}

const PDV = () => {
  const { toast } = useToast();
  const { user } = useAuth(); // Add this line to get the current user
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [desconto, setDesconto] = useState(0);
  const [senhaDesconto, setSenhaDesconto] = useState('');
  const [mostrarDesconto, setMostrarDesconto] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProducts();
    loadClientes();
    // Focus no input de código de barras
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('ativo', true);
      
    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar produtos",
        variant: "destructive"
      });
      return;
    }
    
    setProducts(data || []);
  };

  const loadClientes = async () => {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, nome, cpf')
      .eq('ativo', true);
      
    if (data) {
      setClientes(data);
    }
  };

  const handleBarcodeSearch = (codigo: string) => {
    if (!codigo.trim()) return;
    
    const product = products.find(p => 
      p.codigo_interno === codigo || p.codigo_barras === codigo
    );
    
    if (product) {
      addToCart(product);
      setSearchTerm('');
    } else {
      toast({
        title: "Produto não encontrado",
        description: `Código "${codigo}" não encontrado`,
        variant: "destructive"
      });
    }
  };

  const handleProductSearch = (nome: string) => {
    if (!nome.trim()) return;
    
    const product = products.find(p => 
      p.nome.toLowerCase().includes(nome.toLowerCase())
    );
    
    if (product) {
      addToCart(product);
      setSearchTerm('');
    } else {
      toast({
        title: "Produto não encontrado",
        description: `Produto "${nome}" não encontrado`,
        variant: "destructive"
      });
    }
  };

  const addToCart = (product: Product) => {
    if (product.estoque_atual <= 0) {
      toast({
        title: "Estoque insuficiente",
        description: `Produto "${product.nome}" sem estoque`,
        variant: "destructive"
      });
      return;
    }

    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantidade >= product.estoque_atual) {
        toast({
          title: "Estoque insuficiente",
          description: `Estoque disponível: ${product.estoque_atual}`,
          variant: "destructive"
        });
        return;
      }
      updateQuantity(product.id, existingItem.quantidade + 1);
    } else {
      const newItem: CartItem = {
        ...product,
        quantidade: 1,
        subtotal: product.preco_venda
      };
      setCart([...cart, newItem]);
    }
    
    toast({
      title: "Produto adicionado",
      description: `${product.nome} adicionado ao carrinho`,
    });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (product && newQuantity > product.estoque_atual) {
      toast({
        title: "Estoque insuficiente",
        description: `Estoque disponível: ${product.estoque_atual}`,
        variant: "destructive"
      });
      return;
    }

    setCart(cart.map(item => 
      item.id === productId 
        ? { ...item, quantidade: newQuantity, subtotal: item.preco_venda * newQuantity }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0);
  };

  const getTotal = () => {
    const subtotal = getSubtotal();
    return subtotal - desconto;
  };

  const aplicarDesconto = () => {
    if (senhaDesconto !== 'abacate') {
      toast({
        title: "Senha incorreta",
        description: "Senha para desconto inválida",
        variant: "destructive"
      });
      return;
    }
    
    setMostrarDesconto(false);
    setSenhaDesconto('');
    toast({
      title: "Desconto aplicado",
      description: `Desconto de ${formatCurrency(desconto)} aplicado`,
    });
  };

  const finalizarVenda = async () => {
    if (cart.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos ao carrinho",
        variant: "destructive"
      });
      return;
    }

    if (!formaPagamento) {
      toast({
        title: "Forma de pagamento",
        description: "Selecione a forma de pagamento",
        variant: "destructive"
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Erro de autenticação",
        description: "Usuário não identificado. Faça login novamente.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Criar venda
      const { data: venda, error: vendaError } = await supabase
        .from('vendas')
        .insert({
          cliente_id: selectedClient && selectedClient !== 'sem-cliente' ? selectedClient : null,
          usuario_id: user.id, // Use the user ID from the auth context
          subtotal: getSubtotal(),
          desconto,
          total: getTotal(),
          forma_pagamento: formaPagamento,
        })
        .select()
        .single();

      if (vendaError) throw vendaError;

      // Inserir itens da venda
      const itensVenda = cart.map(item => ({
        venda_id: venda.id,
        produto_id: item.id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_venda,
        subtotal: item.subtotal,
      }));

      const { error: itensError } = await supabase
        .from('itens_venda')
        .insert(itensVenda);

      if (itensError) throw itensError;

      // Limpar carrinho
      setCart([]);
      setSelectedClient('sem-cliente');
      setDesconto(0);
      setFormaPagamento('');
      
      toast({
        title: "Venda finalizada!",
        description: `Venda #${venda.numero_venda} realizada com sucesso`,
      });

    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      toast({
        title: "Erro",
        description: "Erro ao finalizar venda",
        variant: "destructive"
      });
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Área de produtos e busca */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5" />
              <span>Buscar Produtos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código de Barras / Código Interno</Label>
                <Input
                  ref={barcodeInputRef}
                  type="text"
                  placeholder="Digite o código ou bipe o produto"
                  className="barcode-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleBarcodeSearch(searchTerm);
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Nome do Produto</Label>
                <Input
                  type="text"
                  placeholder="Digite o nome do produto"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleProductSearch(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de produtos em grid */}
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle>Produtos Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
              {products.slice(0, 20).map((product) => (
                <Card 
                  key={product.id} 
                  className="cursor-pointer hover:shadow-md transition-smooth border-2 hover:border-primary"
                  onClick={() => addToCart(product)}
                >
                  <CardContent className="p-3">
                    <div className="text-sm font-medium truncate">{product.nome}</div>
                    <div className="text-xs text-muted-foreground">
                      Cód: {product.codigo_interno}
                    </div>
                    <div className="text-lg font-bold currency text-primary mt-1">
                      {formatCurrency(product.preco_venda)}
                    </div>
                    <Badge variant={product.estoque_atual > 0 ? "outline" : "destructive"} className="text-xs">
                      Est: {product.estoque_atual}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Carrinho e checkout */}
      <div className="space-y-6">
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5" />
                <span>Carrinho</span>
              </div>
              <Badge variant="outline" className="bg-primary text-primary-foreground">
                {cart.length} itens
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Carrinho vazio
              </p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.preco_venda)} cada
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantidade - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-mono">{item.quantidade}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantidade + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Totais e checkout */}
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="h-5 w-5" />
              <span>Finalizar Venda</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cliente */}
            <div className="space-y-2">
              <Label>Cliente (Opcional)</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sem-cliente">Venda sem cliente</SelectItem>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome} {cliente.cpf && `(${cliente.cpf})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Desconto */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Desconto</Label>
                <Dialog open={mostrarDesconto} onOpenChange={setMostrarDesconto}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Percent className="h-4 w-4 mr-1" />
                      Aplicar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Aplicar Desconto</DialogTitle>
                      <DialogDescription>
                        Digite a senha para aplicar desconto
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Valor do desconto</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={desconto}
                          onChange={(e) => setDesconto(parseFloat(e.target.value) || 0)}
                          placeholder="0,00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Senha para desconto</Label>
                        <Input
                          type="password"
                          value={senhaDesconto}
                          onChange={(e) => setSenhaDesconto(e.target.value)}
                          placeholder="Digite a senha"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={aplicarDesconto}>Aplicar Desconto</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              {desconto > 0 && (
                <div className="text-sm text-success">
                  Desconto: {formatCurrency(desconto)}
                </div>
              )}
            </div>

            {/* Forma de pagamento */}
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">
                    <div className="flex items-center space-x-2">
                      <Banknote className="h-4 w-4" />
                      <span>Dinheiro</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="cartao_debito">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4" />
                      <span>Cartão de Débito</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="cartao_credito">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4" />
                      <span>Cartão de Crédito</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Totais */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="currency">{formatCurrency(getSubtotal())}</span>
              </div>
              {desconto > 0 && (
                <div className="flex justify-between text-success">
                  <span>Desconto:</span>
                  <span className="currency">-{formatCurrency(desconto)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="currency pdv-display">{formatCurrency(getTotal())}</span>
              </div>
            </div>

            <Button 
              onClick={finalizarVenda}
              disabled={cart.length === 0 || loading}
              className="w-full"
              variant="success"
              size="lg"
            >
              {loading ? 'Finalizando...' : 'Finalizar Venda'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PDV;