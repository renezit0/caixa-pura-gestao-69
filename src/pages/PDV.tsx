import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { ShoppingCart, Trash2, Plus, Minus, Search, Calculator, CreditCard, Banknote, Percent, PackagePlus, Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { imprimirCupomFiscal } from '@/lib/impressao';
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
  desconto_item: number;
}
interface Cliente {
  id: string;
  nome: string;
  cpf?: string;
  telefone?: string;
}
const PDV = () => {
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();
  const isMobile = useIsMobile();
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados para busca de produto (F5)
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [searchedProducts, setSearchedProducts] = useState<Product[]>([]);

  // Configuração de estoque
  const [permitirEstoqueNegativo, setPermitirEstoqueNegativo] = useState(false);

  // Estados para desconto por item
  const [showDescontoItem, setShowDescontoItem] = useState(false);
  const [itemDescontoId, setItemDescontoId] = useState<string>('');
  const [senhaDesconto, setSenhaDesconto] = useState('');
  const [valorDescontoItem, setValorDescontoItem] = useState(0);

  // Estados para produto não cadastrado
  const [vendaSemCadastro, setVendaSemCadastro] = useState(false);
  const [isProdutoNaoCadastradoOpen, setIsProdutoNaoCadastradoOpen] = useState(false);
  const [produtoTemp, setProdutoTemp] = useState({
    nome: '',
    preco_venda: 0,
    preco_custo: 0,
    quantidade: 1
  });

  // Estados para busca e cadastro de cliente
  const [clienteSearchTerm, setClienteSearchTerm] = useState('');
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const [isNovoClienteOpen, setIsNovoClienteOpen] = useState(false);
  const [novoCliente, setNovoCliente] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    email: ''
  });
  useEffect(() => {
    loadProducts();
    loadClientes();
    loadConfiguracoes();

    // Listeners para teclas F5, F7 e F2
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'F5') {
        e.preventDefault();
        setShowProductSearch(true);
      } else if (e.key === 'F7') {
        e.preventDefault();
        if (vendaSemCadastro) {
          setIsProdutoNaoCadastradoOpen(true);
        }
      } else if (e.key === 'F2') {
        e.preventDefault();
        finalizarVenda();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [vendaSemCadastro]);
  const loadConfiguracoes = async () => {
    // Carregar venda sem cadastro
    const {
      data: vendaSemCadastroConfig
    } = await supabase.from('configuracoes').select('*').eq('chave', 'venda_sem_cadastro').maybeSingle();
    if (vendaSemCadastroConfig) {
      setVendaSemCadastro(vendaSemCadastroConfig.valor);
    }

    // Carregar permitir estoque negativo
    const {
      data: estoqueNegativoConfig
    } = await supabase.from('configuracoes').select('*').eq('chave', 'estoque_permitir_negativo').maybeSingle();
    if (estoqueNegativoConfig) {
      setPermitirEstoqueNegativo(estoqueNegativoConfig.valor);
    }
  };
  const loadProducts = async () => {
    const {
      data,
      error
    } = await supabase.from('produtos').select('*').eq('ativo', true);
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
    const {
      data,
      error
    } = await supabase.from('clientes').select('id, nome, cpf, telefone').eq('ativo', true);
    if (data) {
      setClientes(data);
    }
  };
  const searchClientes = (termo: string) => {
    if (!termo.trim()) {
      setFilteredClientes([]);
      setShowClienteDropdown(false);
      return;
    }
    const termoLower = termo.toLowerCase();
    const filtered = clientes.filter(c => c.nome.toLowerCase().includes(termoLower) || c.cpf?.includes(termo) || c.telefone?.includes(termo));
    setFilteredClientes(filtered);
    setShowClienteDropdown(true);

    // Se não encontrou nenhum resultado, sugerir cadastro
    if (filtered.length === 0 && termo.length > 2) {
      // Não fazer nada aqui, o usuário verá "Nenhum cliente encontrado" no dropdown
    }
  };
  const handleClienteSearch = (value: string) => {
    setClienteSearchTerm(value);
    searchClientes(value);
  };
  const handleSelectCliente = (cliente: Cliente) => {
    setSelectedClient(cliente.id);
    setClienteSearchTerm(cliente.nome);
    setShowClienteDropdown(false);
  };
  const handleCadastrarNovoCliente = async () => {
    if (!novoCliente.nome.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Nome do cliente é obrigatório",
        variant: "destructive"
      });
      return;
    }
    try {
      const {
        data: clienteCriado,
        error
      } = await supabase.from('clientes').insert({
        nome: novoCliente.nome.toUpperCase(),
        cpf: novoCliente.cpf || null,
        telefone: novoCliente.telefone || null,
        email: novoCliente.email || null,
        ativo: true
      }).select().single();
      if (error) throw error;
      toast({
        title: "Cliente cadastrado!",
        description: "Cliente cadastrado com sucesso"
      });

      // Atualizar lista e selecionar o novo cliente
      await loadClientes();
      if (clienteCriado) {
        setSelectedClient(clienteCriado.id);
        setClienteSearchTerm(clienteCriado.nome);
      }

      // Limpar e fechar modal
      setNovoCliente({
        nome: '',
        cpf: '',
        telefone: '',
        email: ''
      });
      setIsNovoClienteOpen(false);
    } catch (error) {
      console.error('Erro ao cadastrar cliente:', error);
      toast({
        title: "Erro",
        description: "Erro ao cadastrar cliente",
        variant: "destructive"
      });
    }
  };
  const searchProducts = () => {
    if (!productSearchTerm.trim()) {
      setSearchedProducts([]);
      return;
    }
    const filtered = products.filter(p => p.nome.toLowerCase().includes(productSearchTerm.toLowerCase()) || p.codigo_interno.toLowerCase().includes(productSearchTerm.toLowerCase()) || p.codigo_barras?.toLowerCase().includes(productSearchTerm.toLowerCase()));
    setSearchedProducts(filtered);
  };
  const handleBarcodeSearch = (codigo: string) => {
    if (!codigo.trim()) return;
    const product = products.find(p => p.codigo_interno === codigo || p.codigo_barras === codigo);
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
  const addToCart = (product: Product) => {
    // Só verificar estoque se a configuração não permitir estoque negativo
    if (!permitirEstoqueNegativo && product.estoque_atual <= 0) {
      toast({
        title: "Estoque insuficiente",
        description: `Produto "${product.nome}" sem estoque`,
        variant: "destructive"
      });
      return;
    }
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      // Só verificar quantidade máxima se não permitir estoque negativo
      if (!permitirEstoqueNegativo && existingItem.quantidade >= product.estoque_atual) {
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
        subtotal: product.preco_venda,
        desconto_item: 0
      };
      setCart([...cart, newItem]);
    }
    setShowProductSearch(false);
    setProductSearchTerm('');
    toast({
      title: "Produto adicionado",
      description: `${product.nome} adicionado ao carrinho`
    });
  };
  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    // Só verificar estoque se não permitir estoque negativo
    if (!permitirEstoqueNegativo) {
      const product = products.find(p => p.id === productId);
      if (product && newQuantity > product.estoque_atual) {
        toast({
          title: "Estoque insuficiente",
          description: `Estoque disponível: ${product.estoque_atual}`,
          variant: "destructive"
        });
        return;
      }
    }
    setCart(cart.map(item => item.id === productId ? {
      ...item,
      quantidade: newQuantity,
      subtotal: item.preco_venda * newQuantity - item.desconto_item
    } : item));
  };
  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };
  const aplicarDescontoItem = () => {
    if (senhaDesconto !== 'abacate') {
      toast({
        title: "Senha incorreta",
        description: "Senha para desconto inválida",
        variant: "destructive"
      });
      return;
    }
    setCart(cart.map(item => item.id === itemDescontoId ? {
      ...item,
      desconto_item: valorDescontoItem,
      subtotal: item.preco_venda * item.quantidade - valorDescontoItem
    } : item));
    setShowDescontoItem(false);
    setSenhaDesconto('');
    setValorDescontoItem(0);
    setItemDescontoId('');
    toast({
      title: "Desconto aplicado",
      description: `Desconto de ${formatCurrency(valorDescontoItem)} aplicado`
    });
  };
  const openDescontoItem = (itemId: string) => {
    setItemDescontoId(itemId);
    setShowDescontoItem(true);
  };
  const handleAdicionarProdutoTemp = async () => {
    if (!produtoTemp.nome || produtoTemp.preco_venda <= 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e preço de venda são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    // Criar produto temporário no banco com estoque inicial de 1
    const {
      data: novoProduto,
      error
    } = await supabase.from('produtos').insert({
      nome: produtoTemp.nome.toUpperCase(),
      preco_venda: produtoTemp.preco_venda,
      preco_custo: produtoTemp.preco_custo || 0,
      estoque_atual: 1,
      estoque_minimo: 0,
      unidade_medida: 'UN',
      produto_temporario: true,
      codigo_interno: Math.floor(Math.random() * 99900 + 100).toString()
    }).select().single();
    if (error || !novoProduto) {
      toast({
        title: "Erro",
        description: "Erro ao criar produto temporário",
        variant: "destructive"
      });
      return;
    }

    // Registrar entrada no estoque (já que o produto foi vendido, havia 1 em estoque)
    await supabase.from('movimentacao_estoque').insert({
      produto_id: novoProduto.id,
      tipo_movimentacao: 'entrada',
      quantidade: 1,
      valor_unitario: produtoTemp.preco_custo || 0,
      valor_total: produtoTemp.preco_custo || 0,
      observacao: 'Entrada automática - Produto temporário'
    });

    // Adicionar ao carrinho
    const newItem: CartItem = {
      ...novoProduto,
      quantidade: produtoTemp.quantidade,
      subtotal: novoProduto.preco_venda * produtoTemp.quantidade,
      desconto_item: 0
    };
    setCart([...cart, newItem]);

    // Resetar form
    setProdutoTemp({
      nome: '',
      preco_venda: 0,
      preco_custo: 0,
      quantidade: 1
    });
    setIsProdutoNaoCadastradoOpen(false);
    toast({
      title: "Produto adicionado",
      description: "Produto não cadastrado adicionado ao carrinho"
    });
  };
  const getTotal = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0);
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
      const subtotal = cart.reduce((sum, item) => sum + item.preco_venda * item.quantidade, 0);
      const totalDescontos = cart.reduce((sum, item) => sum + item.desconto_item, 0);

      // Criar venda
      const {
        data: venda,
        error: vendaError
      } = await supabase.from('vendas').insert({
        cliente_id: selectedClient && selectedClient !== 'sem-cliente' ? selectedClient : null,
        usuario_id: user.id,
        subtotal,
        desconto: totalDescontos,
        total: getTotal(),
        forma_pagamento: formaPagamento
      }).select().single();
      if (vendaError) throw vendaError;

      // Inserir itens da venda
      const itensVenda = cart.map(item => ({
        venda_id: venda.id,
        produto_id: item.id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_venda,
        desconto_item: item.desconto_item,
        subtotal: item.subtotal
      }));
      const {
        error: itensError
      } = await supabase.from('itens_venda').insert(itensVenda);
      if (itensError) throw itensError;

      // Buscar dados da empresa para impressão
      const { data: empresaData } = await supabase
        .from('empresa')
        .select('nome, cnpj, endereco, telefone')
        .single();

      // Buscar dados do cliente se houver
      let clienteData = undefined;
      if (selectedClient && selectedClient !== 'sem-cliente') {
        const { data } = await supabase
          .from('clientes')
          .select('nome, cpf, telefone')
          .eq('id', selectedClient)
          .single();
        clienteData = data || undefined;
      }

      // Preparar dados para impressão
      const dadosImpressao = {
        venda: {
          id: venda.id,
          numero_venda: venda.numero_venda,
          created_at: venda.created_at || new Date().toISOString(),
          subtotal: venda.subtotal,
          desconto: venda.desconto || 0,
          total: venda.total,
          forma_pagamento: venda.forma_pagamento || ''
        },
        itens: cart.map(item => ({
          nome: item.nome,
          quantidade: item.quantidade,
          preco_unitario: item.preco_venda,
          desconto_item: item.desconto_item,
          subtotal: item.subtotal
        })),
        cliente: clienteData,
        empresa: empresaData || {
          nome: 'seeStore',
          cnpj: undefined,
          endereco: undefined,
          telefone: undefined
        }
      };

      // Imprimir cupom fiscal
      imprimirCupomFiscal(dadosImpressao);

      // Limpar carrinho
      setCart([]);
      setSelectedClient('sem-cliente');
      setClienteSearchTerm('');
      setFormaPagamento('');

      // Focar novamente no input de código
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
      toast({
        title: "Venda finalizada!",
        description: `Venda #${venda.numero_venda} realizada com sucesso`
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
  return <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6 h-full">
      {/* Área principal do caixa */}
      <div className="lg:col-span-3 space-y-4 lg:space-y-6">
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <Calculator className="h-5 w-5" />
                <span>PDV - Ponto de Venda</span>
              </div>
              {!isMobile && <div className="text-sm text-muted-foreground whitespace-nowrap">
                  F5: Buscar | F7: Não cadastrado | F2: Finalizar
                </div>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Código de Barras / Código Interno</Label>
              <Input ref={barcodeInputRef} type="text" placeholder="Digite o código ou bipe o produto" className="text-lg font-mono" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleBarcodeSearch(searchTerm);
              } else if (e.key === 'Tab' && !e.shiftKey) {
                // Tab normal vai para o próximo campo naturalmente
              }
            }} />
              {vendaSemCadastro && <Button variant="outline" onClick={() => setIsProdutoNaoCadastradoOpen(true)} className="w-full sm:w-auto">
                  <PackagePlus className="h-4 w-4 mr-2" />
                  Produto não cadastrado {!isMobile && "(F7)"}
                </Button>}
            </div>
          </CardContent>
        </Card>

        {/* Lista de itens do carrinho */}
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5" />
                <span>Itens da Venda</span>
              </div>
              <Badge variant="outline" className="bg-primary text-primary-foreground">
                {cart.length} itens
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? <p className="text-center text-muted-foreground py-8">
                Use o leitor de código de barras ou pressione F5 para buscar produtos
              </p> : <div className="space-y-2 lg:space-y-3 max-h-96 overflow-y-auto">
                {cart.map(item => <div key={item.id} className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-3 lg:p-4 bg-muted/50 rounded-lg gap-3">
                    <div className="flex-1 min-w-0 w-full lg:w-auto">
                      <p className="font-medium text-sm lg:text-base">{item.nome}</p>
                      <p className="text-xs lg:text-sm text-muted-foreground">
                        {formatCurrency(item.preco_venda)} cada
                        {item.desconto_item > 0 && <span className="text-success ml-2">
                            (desc: {formatCurrency(item.desconto_item)})
                          </span>}
                      </p>
                    </div>
                    <div className="flex items-center justify-between lg:justify-start w-full lg:w-auto gap-2">
                      <div className="flex items-center space-x-1 lg:space-x-2">
                        <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, item.quantidade - 1)} className="h-8 w-8 p-0">
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 lg:w-12 text-center font-mono text-base lg:text-lg">{item.quantidade}</span>
                        <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, item.quantidade + 1)} className="h-8 w-8 p-0">
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center space-x-1 lg:space-x-2">
                        <Button size="sm" variant="outline" onClick={() => openDescontoItem(item.id)} className="h-8 w-8 p-0">
                          <Percent className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => removeFromCart(item.id)} className="h-8 w-8 p-0">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-right lg:ml-4">
                        <p className="font-bold text-base lg:text-lg">{formatCurrency(item.subtotal)}</p>
                      </div>
                    </div>
                  </div>)}
              </div>}
          </CardContent>
        </Card>
      </div>

      {/* Área de checkout */}
      <div className="lg:col-span-2 space-y-4 lg:space-y-6">
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
              <div className="relative">
                <Input placeholder="Buscar por nome, CPF ou telefone..." value={clienteSearchTerm} onChange={e => handleClienteSearch(e.target.value)} onFocus={() => clienteSearchTerm && setShowClienteDropdown(true)} />
                
                {showClienteDropdown && <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-y-auto">
                    {filteredClientes.length > 0 ? filteredClientes.map(cliente => <div key={cliente.id} className="px-3 py-2 hover:bg-accent cursor-pointer" onClick={() => handleSelectCliente(cliente)}>
                          <p className="font-medium">{cliente.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {cliente.cpf && `CPF: ${cliente.cpf}`}
                            {cliente.cpf && cliente.telefone && ' | '}
                            {cliente.telefone && `Tel: ${cliente.telefone}`}
                          </p>
                        </div>) : <div className="px-3 py-4 text-center">
                        <p className="text-sm text-muted-foreground mb-2">
                          Nenhum cliente encontrado
                        </p>
                        <Button size="sm" onClick={() => {
                    setIsNovoClienteOpen(true);
                    setShowClienteDropdown(false);
                  }}>
                          <Plus className="h-3 w-3 mr-1" />
                          Cadastrar Novo Cliente
                        </Button>
                      </div>}
                  </div>}
              </div>
              
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => {
                setSelectedClient('');
                setClienteSearchTerm('');
                setShowClienteDropdown(false);
              }} className="flex-1">
                  Limpar
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setIsNovoClienteOpen(true)} className="flex-1">
                  <Plus className="h-3 w-3 mr-1" />
                  Novo Cliente
                </Button>
              </div>
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

            {/* Total */}
            <div className="space-y-2">
              <div className="flex justify-between text-2xl font-bold">
                <span>TOTAL:</span>
                <span className="currency pdv-display text-primary">
                  {formatCurrency(getTotal())}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Button onClick={finalizarVenda} disabled={cart.length === 0 || loading} className="w-full" size="lg">
                <Printer className="h-4 w-4 mr-2" />
                {loading ? 'Finalizando...' : 'Finalizar Venda (F2)'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog para busca de produtos (F5) */}
      <Dialog open={showProductSearch} onOpenChange={setShowProductSearch}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Buscar Produto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Digite o nome, código interno ou código de barras..." value={productSearchTerm} onChange={e => setProductSearchTerm(e.target.value)} onKeyPress={e => {
              if (e.key === 'Enter') {
                searchProducts();
              }
            }} autoFocus />
              <Button onClick={searchProducts}>
                <Search className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {searchedProducts.map(product => <div key={product.id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg cursor-pointer" onClick={() => addToCart(product)}>
                  <div>
                    <p className="font-medium">{product.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      Código: {product.codigo_interno} | Estoque: {product.estoque_atual}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(product.preco_venda)}</p>
                  </div>
                </div>)}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para desconto por item */}
      <Dialog open={showDescontoItem} onOpenChange={setShowDescontoItem}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aplicar Desconto no Item</DialogTitle>
            <DialogDescription>
              Digite a senha para aplicar desconto no item
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Valor do desconto</Label>
              <Input type="number" step="0.01" value={valorDescontoItem} onChange={e => setValorDescontoItem(parseFloat(e.target.value) || 0)} placeholder="0,00" />
            </div>
            <div className="space-y-2">
              <Label>Senha para desconto</Label>
              <Input type="password" value={senhaDesconto} onChange={e => setSenhaDesconto(e.target.value)} placeholder="Digite a senha" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={aplicarDescontoItem}>Aplicar Desconto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Novo Cliente */}
      <Dialog open={isNovoClienteOpen} onOpenChange={setIsNovoClienteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
            <DialogDescription>
              Cadastro rápido de cliente. Apenas o nome é obrigatório.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="novo-cliente-nome">Nome *</Label>
              <Input id="novo-cliente-nome" value={novoCliente.nome} onChange={e => setNovoCliente({
              ...novoCliente,
              nome: e.target.value.toUpperCase()
            })} placeholder="NOME DO CLIENTE" className="uppercase" />
            </div>

            <div>
              <Label htmlFor="novo-cliente-cpf">CPF</Label>
              <Input id="novo-cliente-cpf" value={novoCliente.cpf} onChange={e => setNovoCliente({
              ...novoCliente,
              cpf: e.target.value
            })} placeholder="000.000.000-00" />
            </div>

            <div>
              <Label htmlFor="novo-cliente-telefone">Telefone</Label>
              <Input id="novo-cliente-telefone" value={novoCliente.telefone} onChange={e => setNovoCliente({
              ...novoCliente,
              telefone: e.target.value
            })} placeholder="(00) 00000-0000" />
            </div>

            <div>
              <Label htmlFor="novo-cliente-email">E-mail</Label>
              <Input id="novo-cliente-email" type="email" value={novoCliente.email} onChange={e => setNovoCliente({
              ...novoCliente,
              email: e.target.value
            })} placeholder="email@exemplo.com" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNovoClienteOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCadastrarNovoCliente}>
              Cadastrar Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Produto Não Cadastrado */}
      <Dialog open={isProdutoNaoCadastradoOpen} onOpenChange={setIsProdutoNaoCadastradoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Produto Não Cadastrado</DialogTitle>
            <DialogDescription>
              Cadastre um produto temporário para esta venda
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="temp-nome">Nome do Produto *</Label>
              <Input id="temp-nome" value={produtoTemp.nome} onChange={e => setProdutoTemp({
              ...produtoTemp,
              nome: e.target.value
            })} placeholder="Digite o nome do produto" />
            </div>

            <div>
              <Label htmlFor="temp-preco">Preço de Venda *</Label>
              <Input id="temp-preco" type="number" step="0.01" value={produtoTemp.preco_venda || ''} onChange={e => setProdutoTemp({
              ...produtoTemp,
              preco_venda: parseFloat(e.target.value) || 0
            })} placeholder="0,00" />
            </div>

            <div>
              <Label htmlFor="temp-custo">Preço de Custo (opcional)</Label>
              <Input id="temp-custo" type="number" step="0.01" value={produtoTemp.preco_custo || ''} onChange={e => setProdutoTemp({
              ...produtoTemp,
              preco_custo: parseFloat(e.target.value) || 0
            })} placeholder="0,00" />
            </div>

            <div>
              <Label htmlFor="temp-qtd">Quantidade</Label>
              <Input id="temp-qtd" type="number" value={produtoTemp.quantidade} onChange={e => setProdutoTemp({
              ...produtoTemp,
              quantidade: parseInt(e.target.value) || 1
            })} placeholder="1" min="1" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProdutoNaoCadastradoOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdicionarProdutoTemp}>
              Adicionar ao Carrinho
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
};
export default PDV;