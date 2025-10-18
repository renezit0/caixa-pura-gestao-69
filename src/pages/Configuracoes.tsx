import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings, ShoppingCart, Package } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Configuracao {
  id: string;
  chave: string;
  valor: boolean;
  descricao: string;
}

const Configuracoes = () => {
  const { toast } = useToast();
  const [configuracoes, setConfiguracoes] = useState<Configuracao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfiguracoes();
  }, []);

  const loadConfiguracoes = async () => {
    const { data, error } = await supabase
      .from('configuracoes')
      .select('*')
      .order('chave');

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações",
        variant: "destructive"
      });
      return;
    }

    setConfiguracoes(data || []);
    setLoading(false);
  };

  const handleToggle = async (config: Configuracao) => {
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

    loadConfiguracoes();
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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Configure as opções do sistema</p>
      </div>

      <Card className="card-gradient">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Configurações do PDV</span>
          </CardTitle>
          <CardDescription>
            Configure o comportamento do sistema de vendas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <p className="text-muted-foreground">Carregando configurações...</p>
          ) : (
            configuracoes.map((config) => {
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
                    onCheckedChange={() => handleToggle(config)}
                  />
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Configuracoes;
