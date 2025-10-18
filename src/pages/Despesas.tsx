import React, { useState } from 'react';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trash2, Search, DollarSign, Calendar } from 'lucide-react';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { ResponsiveList } from '@/components/ui/responsive-list';
import { Badge } from '@/components/ui/badge';

interface Despesa {
  id: string;
  descricao: string;
  valor: number;
  categoria?: string;
  data_despesa: string;
  observacoes?: string;
}

export default function Despesas() {
  const [showDialog, setShowDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [novaDespesa, setNovaDespesa] = useState({
    descricao: '',
    valor: 0,
    categoria: '',
    data_despesa: new Date().toISOString().split('T')[0],
    observacoes: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: despesas = [], isLoading: loading, refetch } = useSupabaseQuery<Despesa>(
    ['despesas'],
    async () => {
      const { data, error } = await supabase
        .from('despesas')
        .select('*')
        .order('data_despesa', { ascending: false });
      return { data: data || [], error };
    }
  );

  const handleSave = async () => {
    if (!novaDespesa.descricao || novaDespesa.valor <= 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('despesas')
        .insert({
          descricao: novaDespesa.descricao.toUpperCase(),
          valor: novaDespesa.valor,
          categoria: novaDespesa.categoria || null,
          data_despesa: novaDespesa.data_despesa,
          observacoes: novaDespesa.observacoes || null
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Despesa cadastrada com sucesso"
      });

      setNovaDespesa({
        descricao: '',
        valor: 0,
        categoria: '',
        data_despesa: new Date().toISOString().split('T')[0],
        observacoes: ''
      });
      setShowDialog(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['despesas'] });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao cadastrar despesa",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta despesa?')) return;

    try {
      const { error } = await supabase
        .from('despesas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Despesa excluída com sucesso"
      });

      refetch();
      queryClient.invalidateQueries({ queryKey: ['despesas'] });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir despesa",
        variant: "destructive"
      });
    }
  };

  const filteredDespesas = despesas.filter(despesa =>
    despesa.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    despesa.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDespesas = despesas.reduce((sum, d) => sum + d.valor, 0);

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Despesas</h1>
          <p className="text-muted-foreground">Controle suas despesas e custos</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Nova Despesa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[95vw] max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Cadastrar Despesa</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 px-1">
              <div className="space-y-4 pb-4">
              <div>
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  value={novaDespesa.descricao}
                  onChange={(e) => setNovaDespesa({...novaDespesa, descricao: e.target.value})}
                  placeholder="Ex: Conta de luz"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valor">Valor *</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    value={novaDespesa.valor}
                    onChange={(e) => setNovaDespesa({...novaDespesa, valor: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="data">Data</Label>
                  <Input
                    id="data"
                    type="date"
                    value={novaDespesa.data_despesa}
                    onChange={(e) => setNovaDespesa({...novaDespesa, data_despesa: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="categoria">Categoria</Label>
                <Input
                  id="categoria"
                  value={novaDespesa.categoria}
                  onChange={(e) => setNovaDespesa({...novaDespesa, categoria: e.target.value})}
                  placeholder="Ex: Contas, Aluguel, Funcionários"
                />
              </div>
              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={novaDespesa.observacoes}
                  onChange={(e) => setNovaDespesa({...novaDespesa, observacoes: e.target.value})}
                  placeholder="Informações adicionais..."
                />
              </div>
              <Button onClick={handleSave} className="w-full">
                Cadastrar Despesa
              </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resumo */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Despesas</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">{despesas.length} despesas cadastradas</p>
        </CardContent>
      </Card>

      {/* Filtro */}
      <div className="flex items-center space-x-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por descrição ou categoria..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Despesas</CardTitle>
          <CardDescription>Todas as despesas cadastradas</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : filteredDespesas.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Nenhuma despesa encontrada
            </div>
          ) : (
            <ResponsiveList
              data={filteredDespesas}
              renderCard={(despesa) => (
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold">{despesa.descricao}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {new Date(despesa.data_despesa).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-destructive">
                      R$ {despesa.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  {despesa.categoria && (
                    <Badge variant="outline">{despesa.categoria}</Badge>
                  )}

                  {despesa.observacoes && (
                    <p className="text-sm text-muted-foreground">{despesa.observacoes}</p>
                  )}

                  <div className="flex justify-end pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(despesa.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              )}
              renderTable={() => (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Observações</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDespesas.map((despesa) => (
                      <TableRow key={despesa.id}>
                        <TableCell>
                          {new Date(despesa.data_despesa).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="font-medium">{despesa.descricao}</TableCell>
                        <TableCell>{despesa.categoria || '-'}</TableCell>
                        <TableCell className="text-right text-destructive">
                          R$ {despesa.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {despesa.observacoes || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(despesa.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}