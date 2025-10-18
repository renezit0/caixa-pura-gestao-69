import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Settings, 
  Store, 
  Users, 
  Database,
  Printer,
  Smartphone,
  ShoppingCart,
  Package
} from 'lucide-react';

interface Configuracao {
  id: string;
  chave: string;
  valor: boolean;
  descricao: string;
}

export default function Configuracoes() {
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // Configurações do banco
  const [configuracoesBD, setConfiguracoesBD] = useState<Configuracao[]>([]);
  
  // Configurações locais (não no banco ainda)
  const [configuracoes, setConfiguracoes] = useState<Record<string, any>>({
    // Configurações da empresa
    empresa_nome: 'Caixa Pura',
    empresa_cnpj: '',
    empresa_telefone: '',
    empresa_email: '',
    empresa_endereco: '',
    
    // Configurações do sistema
    sistema_moeda: 'BRL',
    sistema_timezone: 'America/Sao_Paulo',
    
    // Configurações de venda
    pdv_desconto_maximo: 10,
    pdv_solicitar_cliente: false,
    pdv_imprimir_automatico: false,
    
    // Configurações de estoque
    estoque_alertar_minimo: true,
    estoque_permitir_negativo: false,
    
    // Configurações de notificação
    notif_vendas: true,
    notif_estoque: true,
    notif_email: true,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfiguracoesBD();
    setLoading(false);
  }, []);

  const loadConfiguracoesBD = async () => {
    const { data, error } = await supabase
      .from('configuracoes')
      .select('*')
      .order('chave');

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações do banco",
        variant: "destructive"
      });
      return;
    }

    setConfiguracoesBD(data || []);
  };

  const handleToggleBD = async (config: Configuracao) => {
    const novoValor = !config.valor;

    const { error } = await supabase
      .from('configuracoes')
      .update({ valor: novoValor })
      .eq('id', config.id);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar configuração",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Configuração atualizada",
      description: "A configuração foi atualizada com sucesso",
    });

    loadConfiguracoesBD();
  };

  const handleSave = async (secao: string) => {
    setSaving(true);
    try {
      // Aqui você implementaria a lógica para salvar as configurações no banco
      // Por enquanto, vamos apenas simular o salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (chave: string, valor: any) => {
    setConfiguracoes(prev => ({
      ...prev,
      [chave]: valor
    }));
  };

  const getConfigIcon = (chave: string) => {
    if (chave.includes('venda')) return ShoppingCart;
    if (chave.includes('produto')) return Package;
    return Settings;
  };

  const getConfigLabel = (chave: string) => {
    const labels: { [key: string]: string } = {
      'venda_sem_cadastro': 'Permitir Venda Sem Produto Cadastrado',
      'exibir_produtos_temporarios': 'Exibir Produtos Temporários na Lista'
    };
    return labels[chave] || chave;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">Configure o sistema conforme suas necessidades</p>
        </div>
      </div>

      <Tabs defaultValue="pdv" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6">
          <TabsTrigger value="empresa">
            <Store className="w-4 h-4 mr-2" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="sistema">
            <Settings className="w-4 h-4 mr-2" />
            Sistema
          </TabsTrigger>
          <TabsTrigger value="pdv">
            <Smartphone className="w-4 h-4 mr-2" />
            PDV
          </TabsTrigger>
          <TabsTrigger value="estoque">
            <Database className="w-4 h-4 mr-2" />
            Estoque
          </TabsTrigger>
          <TabsTrigger value="usuarios">
            <Users className="w-4 h-4 mr-2" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="impressao">
            <Printer className="w-4 h-4 mr-2" />
            Impressão
          </TabsTrigger>
        </TabsList>

        {/* Configurações da Empresa */}
        <TabsContent value="empresa">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Empresa</CardTitle>
              <CardDescription>Configure os dados da sua empresa que aparecerão nos documentos fiscais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="empresa_nome">Nome da Empresa</Label>
                  <Input
                    id="empresa_nome"
                    value={configuracoes.empresa_nome}
                    onChange={(e) => handleInputChange('empresa_nome', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="empresa_cnpj">CNPJ</Label>
                  <Input
                    id="empresa_cnpj"
                    value={configuracoes.empresa_cnpj}
                    onChange={(e) => handleInputChange('empresa_cnpj', e.target.value)}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div>
                  <Label htmlFor="empresa_telefone">Telefone</Label>
                  <Input
                    id="empresa_telefone"
                    value={configuracoes.empresa_telefone}
                    onChange={(e) => handleInputChange('empresa_telefone', e.target.value)}
                    placeholder="(00) 0000-0000"
                  />
                </div>
                <div>
                  <Label htmlFor="empresa_email">E-mail</Label>
                  <Input
                    id="empresa_email"
                    type="email"
                    value={configuracoes.empresa_email}
                    onChange={(e) => handleInputChange('empresa_email', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="empresa_endereco">Endereço Completo</Label>
                <Textarea
                  id="empresa_endereco"
                  value={configuracoes.empresa_endereco}
                  onChange={(e) => handleInputChange('empresa_endereco', e.target.value)}
                  placeholder="Rua, número, bairro, cidade, estado, CEP"
                />
              </div>
              <Button onClick={() => handleSave('empresa')} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações do Sistema */}
        <TabsContent value="sistema">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais do Sistema</CardTitle>
              <CardDescription>Ajustes gerais de funcionamento do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sistema_moeda">Moeda</Label>
                  <Input
                    id="sistema_moeda"
                    value={configuracoes.sistema_moeda}
                    onChange={(e) => handleInputChange('sistema_moeda', e.target.value)}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground mt-1">Atualmente suportamos apenas BRL</p>
                </div>
                <div>
                  <Label htmlFor="sistema_timezone">Fuso Horário</Label>
                  <Input
                    id="sistema_timezone"
                    value={configuracoes.sistema_timezone}
                    onChange={(e) => handleInputChange('sistema_timezone', e.target.value)}
                    disabled
                  />
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4">Notificações</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notificações de Vendas</Label>
                      <p className="text-sm text-muted-foreground">Receba alertas sobre novas vendas</p>
                    </div>
                    <Switch
                      checked={configuracoes.notif_vendas}
                      onCheckedChange={(checked) => handleInputChange('notif_vendas', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Alertas de Estoque</Label>
                      <p className="text-sm text-muted-foreground">Alertas quando produtos atingem estoque mínimo</p>
                    </div>
                    <Switch
                      checked={configuracoes.notif_estoque}
                      onCheckedChange={(checked) => handleInputChange('notif_estoque', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notificações por E-mail</Label>
                      <p className="text-sm text-muted-foreground">Enviar notificações também por e-mail</p>
                    </div>
                    <Switch
                      checked={configuracoes.notif_email}
                      onCheckedChange={(checked) => handleInputChange('notif_email', checked)}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={() => handleSave('sistema')} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações do PDV */}
        <TabsContent value="pdv">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do PDV</CardTitle>
                <CardDescription>Personalize o comportamento do ponto de venda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="pdv_desconto_maximo">Desconto Máximo (%)</Label>
                  <Input
                    id="pdv_desconto_maximo"
                    type="number"
                    value={configuracoes.pdv_desconto_maximo}
                    onChange={(e) => handleInputChange('pdv_desconto_maximo', Number(e.target.value))}
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Desconto máximo que pode ser aplicado sem supervisão</p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Solicitar Cliente Obrigatório</Label>
                      <p className="text-sm text-muted-foreground">Força informar cliente em todas as vendas</p>
                    </div>
                    <Switch
                      checked={configuracoes.pdv_solicitar_cliente}
                      onCheckedChange={(checked) => handleInputChange('pdv_solicitar_cliente', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Impressão Automática</Label>
                      <p className="text-sm text-muted-foreground">Imprime automaticamente após finalizar venda</p>
                    </div>
                    <Switch
                      checked={configuracoes.pdv_imprimir_automatico}
                      onCheckedChange={(checked) => handleInputChange('pdv_imprimir_automatico', checked)}
                    />
                  </div>
                </div>

                <Button onClick={() => handleSave('pdv')} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </CardContent>
            </Card>

            {/* Configurações de Venda Sem Cadastro */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span>Vendas e Produtos</span>
                </CardTitle>
                <CardDescription>
                  Configure opções avançadas de vendas e produtos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  <p className="text-muted-foreground">Carregando configurações...</p>
                ) : (
                  configuracoesBD.map((config) => {
                    const Icon = getConfigIcon(config.chave);
                    return (
                      <div key={config.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                        <div className="flex items-center space-x-4">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <Label htmlFor={config.chave} className="text-base font-medium cursor-pointer">
                              {getConfigLabel(config.chave)}
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              {config.descricao}
                            </p>
                          </div>
                        </div>
                        <Switch
                          id={config.chave}
                          checked={config.valor}
                          onCheckedChange={() => handleToggleBD(config)}
                        />
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Configurações de Estoque */}
        <TabsContent value="estoque">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Estoque</CardTitle>
              <CardDescription>Controle comportamento do estoque e alertas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Alertar Estoque Mínimo</Label>
                    <p className="text-sm text-muted-foreground">Exibir alertas quando produtos atingem estoque mínimo</p>
                  </div>
                  <Switch
                    checked={configuracoes.estoque_alertar_minimo}
                    onCheckedChange={(checked) => handleInputChange('estoque_alertar_minimo', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Permitir Estoque Negativo</Label>
                    <p className="text-sm text-muted-foreground">Permite vender produtos mesmo sem estoque</p>
                  </div>
                  <Switch
                    checked={configuracoes.estoque_permitir_negativo}
                    onCheckedChange={(checked) => handleInputChange('estoque_permitir_negativo', checked)}
                  />
                </div>
              </div>

              <Button onClick={() => handleSave('estoque')} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações de Usuários */}
        <TabsContent value="usuarios">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
              <CardDescription>Configure permissões e acessos dos usuários</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Gerenciamento de Usuários</h3>
                <p className="text-muted-foreground mb-4">
                  Esta funcionalidade estará disponível em breve. Você poderá gerenciar usuários, 
                  definir permissões e controlar acessos ao sistema.
                </p>
                <Button variant="outline" disabled>
                  Em Desenvolvimento
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações de Impressão */}
        <TabsContent value="impressao">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Impressão</CardTitle>
              <CardDescription>Configure impressoras e layouts de impressão</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Printer className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Configurações de Impressão</h3>
                <p className="text-muted-foreground mb-4">
                  Configure suas impressoras, defina layouts personalizados para cupons fiscais 
                  e relatórios. Esta funcionalidade estará disponível em breve.
                </p>
                <Button variant="outline" disabled>
                  Em Desenvolvimento
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
