import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, Building2 } from 'lucide-react';

interface Empresa {
  id: string;
  nome: string;
  logo_url: string | null;
  endereco: string | null;
  telefone: string | null;
  email: string | null;
  cnpj: string | null;
}

export const EmpresaConfig: React.FC = () => {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchEmpresa();
  }, []);

  const fetchEmpresa = async () => {
    const { data, error } = await supabase
      .from('empresa')
      .select('*')
      .limit(1)
      .single();

    if (!error && data) {
      setEmpresa(data);
    }
    setLoading(false);
  };

  const handleUpdateEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresa) return;

    const { error } = await supabase
      .from('empresa')
      .update({
        nome: empresa.nome,
        endereco: empresa.endereco,
        telefone: empresa.telefone,
        email: empresa.email,
        cnpj: empresa.cnpj,
        updated_at: new Date().toISOString()
      })
      .eq('id', empresa.id);

    if (error) {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Sucesso!',
        description: 'Informações da empresa atualizadas'
      });
      window.dispatchEvent(new Event('empresaUpdated'));
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !empresa) return;

    setUploading(true);

    // Delete old logo if exists
    if (empresa.logo_url) {
      const oldPath = empresa.logo_url.split('/').pop();
      if (oldPath) {
        await supabase.storage.from('logos').remove([oldPath]);
      }
    }

    // Upload new logo
    const fileExt = file.name.split('.').pop();
    const fileName = `${empresa.id}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast({
        title: 'Erro no upload',
        description: uploadError.message,
        variant: 'destructive'
      });
      setUploading(false);
      return;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('logos')
      .getPublicUrl(fileName);

    // Update empresa record
    const { error: updateError } = await supabase
      .from('empresa')
      .update({ logo_url: publicUrl })
      .eq('id', empresa.id);

    if (updateError) {
      toast({
        title: 'Erro ao atualizar',
        description: updateError.message,
        variant: 'destructive'
      });
    } else {
      setEmpresa({ ...empresa, logo_url: publicUrl });
      toast({
        title: 'Sucesso!',
        description: 'Logotipo atualizado'
      });
      window.dispatchEvent(new Event('empresaUpdated'));
    }

    setUploading(false);
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!empresa) {
    return <div>Empresa não encontrada</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Informações da Empresa
        </CardTitle>
        <CardDescription>
          Configure os dados da sua empresa
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdateEmpresa} className="space-y-6">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Logotipo</Label>
            <div className="flex items-center gap-4">
              {empresa.logo_url && (
                <img 
                  src={empresa.logo_url} 
                  alt="Logo" 
                  className="h-16 w-16 object-contain rounded-lg border"
                />
              )}
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                  className="hidden"
                  id="logo-upload"
                />
                <Label htmlFor="logo-upload">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    onClick={() => document.getElementById('logo-upload')?.click()}
                    className="cursor-pointer"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? 'Enviando...' : 'Enviar Logotipo'}
                  </Button>
                </Label>
              </div>
            </div>
          </div>

          {/* Empresa Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Empresa *</Label>
              <Input
                id="nome"
                value={empresa.nome}
                onChange={(e) => setEmpresa({ ...empresa, nome: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={empresa.cnpj || ''}
                onChange={(e) => setEmpresa({ ...empresa, cnpj: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={empresa.email || ''}
                onChange={(e) => setEmpresa({ ...empresa, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={empresa.telefone || ''}
                onChange={(e) => setEmpresa({ ...empresa, telefone: e.target.value })}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={empresa.endereco || ''}
                onChange={(e) => setEmpresa({ ...empresa, endereco: e.target.value })}
              />
            </div>
          </div>

          <Button type="submit">
            Salvar Alterações
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
