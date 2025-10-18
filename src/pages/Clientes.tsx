import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  User,
  Phone,
  Mail,
  MapPin
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Cliente {
  id: string;
  nome: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  data_nascimento?: string;
  ativo: boolean;
  created_at: string;
}

const Clientes = () => {
  const { toast } = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentClient, setCurrentClient] = useState<Partial<Cliente>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nome');
      
    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar clientes",
        variant: "destructive"
      });
      return;
    }
    
    setClientes(data || []);
  };

  const handleSave = async () => {
    if (!currentClient.nome) {
      toast({
        title: "Campo obrigatório",
        description: "Nome do cliente é obrigatório",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const clientData = {
        nome: currentClient.nome,
        cpf: currentClient.cpf || null,
        email: currentClient.email || null,
        telefone: currentClient.telefone || null,
        endereco: currentClient.endereco || null,
        cidade: currentClient.cidade || null,
        estado: currentClient.estado || null,
        cep: currentClient.cep || null,
        data_nascimento: currentClient.data_nascimento || null,
        ativo: currentClient.ativo !== false,
      };

      if (isEditing && currentClient.id) {
        const { error } = await supabase
          .from('clientes')
          .update(clientData)
          .eq('id', currentClient.id);

        if (error) throw error;

        toast({
          title: "Cliente atualizado!",
          description: "Cliente atualizado com sucesso",
        });
      } else {
        const { error } = await supabase
          .from('clientes')
          .insert(clientData);

        if (error) throw error;

        toast({
          title: "Cliente cadastrado!",
          description: "Cliente cadastrado com sucesso",
        });
      }

      loadClientes();
      handleCloseDialog();

    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar cliente",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setCurrentClient(cliente);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;

    const { error } = await supabase
      .from('clientes')
      .update({ ativo: false })
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir cliente",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Cliente excluído",
      description: "Cliente excluído com sucesso",
    });

    loadClientes();
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setIsEditing(false);
    setCurrentClient({});
  };

  const filteredClientes = clientes.filter(cliente =>
    cliente.ativo && (
      cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.cpf?.includes(searchTerm) ||
      cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.telefone?.includes(searchTerm)
    )
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">Gerencie sua base de clientes</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setCurrentClient({});
              setIsEditing(false);
            }} className="hero-gradient glow-effect">
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
              </DialogTitle>
              <DialogDescription>
                {isEditing ? 'Edite as informações do cliente' : 'Cadastre um novo cliente no sistema'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={currentClient.nome || ''}
                  onChange={(e) => setCurrentClient({...currentClient, nome: e.target.value})}
                  placeholder="Digite o nome completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={currentClient.cpf || ''}
                  onChange={(e) => setCurrentClient({...currentClient, cpf: e.target.value})}
                  placeholder="000.000.000-00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={currentClient.email || ''}
                  onChange={(e) => setCurrentClient({...currentClient, email: e.target.value})}
                  placeholder="cliente@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={currentClient.telefone || ''}
                  onChange={(e) => setCurrentClient({...currentClient, telefone: e.target.value})}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                <Input
                  id="data_nascimento"
                  type="date"
                  value={currentClient.data_nascimento || ''}
                  onChange={(e) => setCurrentClient({...currentClient, data_nascimento: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={currentClient.cep || ''}
                  onChange={(e) => setCurrentClient({...currentClient, cep: e.target.value})}
                  placeholder="00000-000"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={currentClient.endereco || ''}
                  onChange={(e) => setCurrentClient({...currentClient, endereco: e.target.value})}
                  placeholder="Rua, número, complemento"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={currentClient.cidade || ''}
                  onChange={(e) => setCurrentClient({...currentClient, cidade: e.target.value})}
                  placeholder="Nome da cidade"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  value={currentClient.estado || ''}
                  onChange={(e) => setCurrentClient({...currentClient, estado: e.target.value})}
                  placeholder="UF"
                  maxLength={2}
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
                  placeholder="Buscar por nome, CPF, e-mail ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Clientes */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Lista de Clientes ({filteredClientes.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableSkeleton rows={5} columns={5} />
                ) : filteredClientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold">Nenhum cliente encontrado</h3>
                      <p className="text-muted-foreground">
                        {searchTerm ? 'Tente ajustar os filtros de pesquisa' : 'Comece cadastrando seu primeiro cliente'}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClientes.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{cliente.nome}</p>
                            {cliente.cpf && (
                              <p className="text-sm text-muted-foreground">CPF: {cliente.cpf}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {cliente.email && (
                            <div className="flex items-center space-x-2">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{cliente.email}</span>
                            </div>
                          )}
                          {cliente.telefone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{cliente.telefone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {cliente.cidade && (
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{cliente.cidade}/{cliente.estado}</span>
                            </div>
                          )}
                          {cliente.cep && (
                            <p className="text-xs text-muted-foreground">CEP: {cliente.cep}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(cliente.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={cliente.ativo ? "default" : "destructive"}>
                          {cliente.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(cliente)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(cliente.id)}
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
          
          {filteredClientes.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Nenhum cliente encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Tente ajustar os filtros de busca' : 'Comece cadastrando seu primeiro cliente'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Clientes;