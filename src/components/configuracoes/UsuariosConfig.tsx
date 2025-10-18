import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Badge } from '@/components/ui/badge';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  username: string | null;
  tipo_usuario: string;
  ativo: boolean;
}

export const UsuariosConfig: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    username: '',
    senha_desconto: '',
    tipo_usuario: 'user'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('nome');

    if (!error && data) {
      setUsuarios(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingUser) {
      // Update user
      const { error } = await supabase
        .from('usuarios')
        .update({
          nome: formData.nome,
          email: formData.email,
          username: formData.username,
          tipo_usuario: formData.tipo_usuario,
          ...(formData.senha_desconto && { senha_desconto: formData.senha_desconto })
        })
        .eq('id', editingUser.id);

      if (error) {
        toast({
          title: 'Erro ao atualizar',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Sucesso!',
          description: 'Usuário atualizado'
        });
        fetchUsuarios();
        resetForm();
      }
    } else {
      // Create user
      const { error } = await supabase
        .from('usuarios')
        .insert({
          nome: formData.nome,
          email: formData.email,
          username: formData.username,
          senha_desconto: formData.senha_desconto,
          tipo_usuario: formData.tipo_usuario,
          ativo: true
        });

      if (error) {
        toast({
          title: 'Erro ao criar',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Sucesso!',
          description: 'Usuário criado'
        });
        fetchUsuarios();
        resetForm();
      }
    }
  };

  const handleEdit = (user: Usuario) => {
    setEditingUser(user);
    setFormData({
      nome: user.nome,
      email: user.email,
      username: user.username || '',
      senha_desconto: '',
      tipo_usuario: user.tipo_usuario
    });
    setDialogOpen(true);
  };

  const handleToggleActive = async (user: Usuario) => {
    const { error } = await supabase
      .from('usuarios')
      .update({ ativo: !user.ativo })
      .eq('id', user.id);

    if (error) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Sucesso!',
        description: `Usuário ${!user.ativo ? 'ativado' : 'desativado'}`
      });
      fetchUsuarios();
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      username: '',
      senha_desconto: '',
      tipo_usuario: 'user'
    });
    setEditingUser(null);
    setDialogOpen(false);
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gerenciar Usuários
            </CardTitle>
            <CardDescription>
              Adicione e gerencie usuários do sistema
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                </DialogTitle>
                <DialogDescription>
                  {editingUser 
                    ? 'Atualize as informações do usuário' 
                    : 'Adicione um novo usuário ao sistema'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senha">Senha {!editingUser && '*'}</Label>
                  <Input
                    id="senha"
                    type="password"
                    value={formData.senha_desconto}
                    onChange={(e) => setFormData({ ...formData, senha_desconto: e.target.value })}
                    required={!editingUser}
                    placeholder={editingUser ? 'Deixe em branco para não alterar' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Usuário *</Label>
                  <Select 
                    value={formData.tipo_usuario} 
                    onValueChange={(value) => setFormData({ ...formData, tipo_usuario: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="user">Usuário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    {editingUser ? 'Atualizar' : 'Criar'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.nome}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.username || '-'}</TableCell>
                <TableCell>
                  <Badge variant={user.tipo_usuario === 'admin' ? 'default' : 'secondary'}>
                    {user.tipo_usuario === 'admin' ? 'Admin' : 'Usuário'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.ativo ? 'default' : 'destructive'}>
                    {user.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(user)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(user)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
