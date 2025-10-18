import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { useQueryClient } from '@tanstack/react-query';
import {
  Truck,
  Plus,
  Search,
  Edit,
  Trash2,
  Building,
  Phone,
  Mail,
  MapPin
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Fornecedor {
  id: string;
  nome: string;
  cnpj?: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  ativo: boolean;
  created_at: string;
}

const Fornecedores = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState<Partial<Fornecedor>>({});
  const [loading, setLoading] = useState(false);

  const { data: fornecedores = [], isLoading, refetch } = useSupabaseQuery<Fornecedor>(
    ['fornecedores'],
    async () => await supabase.from('fornecedores').select('*').order('nome')
  );

  const handleSave = async () => {
    if (!currentSupplier.nome) {
      toast({
        title: "Campo obrigatório",
        description: "Nome do fornecedor é obrigatório",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const supplierData = {
        nome: currentSupplier.nome?.toUpperCase(),
        cnpj: currentSupplier.cnpj || null,
        cpf: currentSupplier.cpf || null,
        email: currentSupplier.email || null,
        telefone: currentSupplier.telefone || null,
        endereco: currentSupplier.endereco || null,
        cidade: currentSupplier.cidade || null,
        estado: currentSupplier.estado || null,
        cep: currentSupplier.cep || null,
        ativo: currentSupplier.ativo !== false,
      };

      if (isEditing && currentSupplier.id) {
        const { error } = await supabase
          .from('fornecedores')
          .update(supplierData)
          .eq('id', currentSupplier.id);

        if (error) throw error;

        toast({
          title: "Fornecedor atualizado!",
          description: "Fornecedor atualizado com sucesso",
        });
      } else {
        const { error } = await supabase
          .from('fornecedores')
          .insert(supplierData);

        if (error) throw error;

        toast({
          title: "Fornecedor cadastrado!",
          description: "Fornecedor cadastrado com sucesso",
        });
      }

      refetch();
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      handleCloseDialog();

    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar fornecedor",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (fornecedor: Fornecedor) => {
    setCurrentSupplier(fornecedor);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este fornecedor?')) return;

    const { error } = await supabase
      .from('fornecedores')
      .update({ ativo: false })
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir fornecedor",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Fornecedor excluído",
      description: "Fornecedor excluído com sucesso",
    });

    refetch();
    queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setIsEditing(false);
    setCurrentSupplier({});
  };

  const filteredFornecedores = fornecedores.filter(fornecedor =>
    fornecedor.ativo && (
      fornecedor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fornecedor.cnpj?.includes(searchTerm) ||
      fornecedor.cpf?.includes(searchTerm) ||
      fornecedor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fornecedor.telefone?.includes(searchTerm)
    )
  );

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Fornecedores</h1>
          <p className="text-muted-foreground text-sm lg:text-base">Gerencie seus fornecedores e parceiros</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setCurrentSupplier({});
              setIsEditing(false);
            }} className="hero-gradient glow-effect">
              <Plus className="h-4 w-4 mr-2" />
              Novo Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </DialogTitle>
              <DialogDescription>
                {isEditing ? 'Edite as informações do fornecedor' : 'Cadastre um novo fornecedor no sistema'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome/Razão Social *</Label>
                <Input
                  id="nome"
                  value={currentSupplier.nome || ''}
                  onChange={(e) => setCurrentSupplier({...currentSupplier, nome: e.target.value})}
                  placeholder="Digite o nome ou razão social"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={currentSupplier.cnpj || ''}
                  onChange={(e) => setCurrentSupplier({...currentSupplier, cnpj: e.target.value})}
                  placeholder="00.000.000/0000-00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF (Pessoa Física)</Label>
                <Input
                  id="cpf"
                  value={currentSupplier.cpf || ''}
                  onChange={(e) => setCurrentSupplier({...currentSupplier, cpf: e.target.value})}
                  placeholder="000.000.000-00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={currentSupplier.telefone || ''}
                  onChange={(e) => setCurrentSupplier({...currentSupplier, telefone: e.target.value})}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={currentSupplier.email || ''}
                  onChange={(e) => setCurrentSupplier({...currentSupplier, email: e.target.value})}
                  placeholder="fornecedor@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={currentSupplier.cep || ''}
                  onChange={(e) => setCurrentSupplier({...currentSupplier, cep: e.target.value})}
                  placeholder="00000-000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={currentSupplier.cidade || ''}
                  onChange={(e) => setCurrentSupplier({...currentSupplier, cidade: e.target.value})}
                  placeholder="Nome da cidade"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  value={currentSupplier.estado || ''}
                  onChange={(e) => setCurrentSupplier({...currentSupplier, estado: e.target.value})}
                  placeholder="UF"
                  maxLength={2}
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={currentSupplier.endereco || ''}
                  onChange={(e) => setCurrentSupplier({...currentSupplier, endereco: e.target.value})}
                  placeholder="Rua, número, complemento"
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
                  placeholder="Buscar por nome, CNPJ, CPF, e-mail ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Fornecedores */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Truck className="h-5 w-5" />
            <span>Lista de Fornecedores ({filteredFornecedores.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredFornecedores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold">Nenhum fornecedor encontrado</h3>
                      <p className="text-muted-foreground">
                        {searchTerm ? 'Tente ajustar os filtros de busca' : 'Comece cadastrando seu primeiro fornecedor'}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFornecedores.map((fornecedor) => (
                    <TableRow key={fornecedor.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                          <Building className="h-5 w-5 text-warning" />
                        </div>
                        <div>
                          <p className="font-medium">{fornecedor.nome}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {fornecedor.cnpj && (
                          <p className="text-sm">CNPJ: {fornecedor.cnpj}</p>
                        )}
                        {fornecedor.cpf && (
                          <p className="text-sm">CPF: {fornecedor.cpf}</p>
                        )}
                        {!fornecedor.cnpj && !fornecedor.cpf && (
                          <p className="text-sm text-muted-foreground">-</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {fornecedor.email && (
                          <div className="flex items-center space-x-2">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{fornecedor.email}</span>
                          </div>
                        )}
                        {fornecedor.telefone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{fornecedor.telefone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {fornecedor.cidade && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{fornecedor.cidade}/{fornecedor.estado}</span>
                          </div>
                        )}
                        {fornecedor.cep && (
                          <p className="text-xs text-muted-foreground">CEP: {fornecedor.cep}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(fornecedor.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={fornecedor.ativo ? "default" : "destructive"}>
                        {fornecedor.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(fornecedor)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(fornecedor.id)}
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

export default Fornecedores;