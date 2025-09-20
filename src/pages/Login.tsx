import React, { useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Store, BarChart3 } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('flavio@admin.com');
  const [password, setPassword] = useState('0549');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        title: "Erro no login",
        description: error.message || "Credenciais inválidas",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Login realizado!",
        description: "Bem-vindo ao sistema de gestão",
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-success/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="bg-primary rounded-lg p-3">
              <Store className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
              Caixa Pura
            </h1>
          </div>
          <p className="text-muted-foreground">Sistema completo de gestão e PDV</p>
        </div>

        {/* Features showcase */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center p-3 rounded-lg bg-card border">
            <ShoppingCart className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">PDV Completo</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-card border">
            <Store className="h-6 w-6 text-success mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Gestão de Estoque</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-card border">
            <BarChart3 className="h-6 w-6 text-warning mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Relatórios</p>
          </div>
        </div>

        {/* Login Form */}
        <Card className="card-gradient border-0 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Entrar no Sistema</CardTitle>
            <CardDescription>
              Digite suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full hero-gradient glow-effect"
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
            
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Credenciais de teste:</p>
              <p className="text-xs font-mono">Admin: flavio@admin.com / 0549</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;