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
  Tag,
  Plus,
  Search,
  Edit,
  Trash2,
  Package
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

interface Categoria {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  created_at: string;
}

const Categorias = () => {
  const { toast } = useToast();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Partial<Categoria>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategorias();
  }, []);

  const loadCategorias = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .order('nome');
      
    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar categorias",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }
    
    setCategorias(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!currentCategory.nome) {
      toast({
        title: "Campo obrigatório",
        description: "Nome da categoria é obrigatório",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const categoryData = {
        nome: currentCategory.nome,
        descricao: currentCategory.descricao || null,
        ativo: currentCategory.ativo !== false,
      };

      if (isEditing && currentCategory.id) {
        const { error } = await supabase
          .from('categorias')
          .update(categoryData)
          .eq('id', currentCategory.id);

        if (error) throw error;

        toast({
          title: "Categoria atualizada!",
          description: "Categoria atualizada com sucesso",
        });
      } else {
        const { error } = await supabase
          .from('categorias')
          .insert(categoryData);

        if (error) throw error;

        toast({
          title: "Categoria cadastrada!",
          description: "Categoria cadastrada com sucesso",
        });
      }

      loadCategorias();
      handleCloseDialog();

    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar categoria",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (categoria: Categoria) => {
    setCurrentCategory(categoria);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;

    const { error } = await supabase
      .from('categorias')
      .update({ ativo: false })
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir categoria",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Categoria excluída",
      description: "Categoria excluída com sucesso",
    });

    loadCategorias();
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setIsEditing(false);
    setCurrentCategory({});
  };

  const filteredCategorias = categorias.filter(categoria =>
    categoria.ativo && categoria.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Categorias</h1>
          <p className="text-muted-foreground">Organize seus produtos por categorias</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setCurrentCategory({});
              setIsEditing(false);
            }} className="hero-gradient glow-effect">
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? 'Editar Categoria' : 'Nova Categoria'}
              </DialogTitle>
              <DialogDescription>
                {isEditing ? 'Edite as informações da categoria' : 'Cadastre uma nova categoria'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Categoria *</Label>
                <Input
                  id="nome"
                  value={currentCategory.nome || ''}
                  onChange={(e) => setCurrentCategory({...currentCategory, nome: e.target.value})}
                  placeholder="Digite o nome da categoria"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={currentCategory.descricao || ''}
                  onChange={(e) => setCurrentCategory({...currentCategory, descricao: e.target.value})}
                  placeholder="Descrição da categoria (opcional)"
                  rows={3}
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
                  placeholder="Buscar categorias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Categorias */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Tag className="h-5 w-5" />
            <span>Lista de Categorias ({filteredCategorias.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableSkeleton rows={5} columns={5} />
                ) : filteredCategorias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold">Nenhuma categoria encontrada</h3>
                      <p className="text-muted-foreground">
                        {searchTerm ? 'Tente ajustar os filtros de busca' : 'Comece cadastrando sua primeira categoria'}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategorias.map((categoria) => (
                    <TableRow key={categoria.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Tag className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{categoria.nome}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground">
                          {categoria.descricao || '-'}
                        </p>
                      </TableCell>
                      <TableCell>
                        {new Date(categoria.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={categoria.ativo ? "default" : "destructive"}>
                          {categoria.ativo ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(categoria)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(categoria.id)}
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

export default Categorias;