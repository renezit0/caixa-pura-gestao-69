import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, User, LogOut, Settings, DollarSign } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
interface HeaderProps {
  onMenuClick: () => void;
}
interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  lida: boolean;
  created_at: string;
}

export const Header: React.FC<HeaderProps> = ({
  onMenuClick
}) => {
  const {
    signOut,
    user
  } = useAuth();
  const navigate = useNavigate();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotificacoes();
    
    // Subscribe to real-time notifications
    const channel = supabase
      .channel('notificacoes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notificacoes'
        },
        () => {
          loadNotificacoes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadNotificacoes = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('lida', false)
        .order('created_at', { ascending: false })
        .limit(10);
      
      setNotificacoes(data || []);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLida = async (id: string) => {
    try {
      await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('id', id);
      
      loadNotificacoes();
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const marcarTodasComoLidas = async () => {
    try {
      await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('lida', false);
      
      loadNotificacoes();
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const getNotificacaoIcon = (tipo: string) => {
    switch (tipo) {
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'success':
        return '✅';
      default:
        return '📢';
    }
  };

  const formatTempo = (dataStr: string) => {
    const data = new Date(dataStr);
    const agora = new Date();
    const diffMs = agora.getTime() - data.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `Há ${diffMins} min`;
    
    const diffHoras = Math.floor(diffMins / 60);
    if (diffHoras < 24) return `Há ${diffHoras}h`;
    
    const diffDias = Math.floor(diffHoras / 24);
    return `Há ${diffDias}d`;
  };

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };
  return <header className="sticky top-0 z-30 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/95 border-b border-border">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          
          
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Status do caixa */}
          <div className="hidden md:flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-success" />
            <Badge variant="outline" className="text-success border-success/50">
              Caixa Aberto
            </Badge>
          </div>

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notificacoes.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-destructive flex items-center justify-center">
                    {notificacoes.length > 9 ? '9+' : notificacoes.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold">Notificações</h3>
                {notificacoes.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={marcarTodasComoLidas}
                    className="text-xs"
                  >
                    Marcar todas como lidas
                  </Button>
                )}
              </div>
              <ScrollArea className="h-[400px]">
                {loading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Carregando...
                  </div>
                ) : notificacoes.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Nenhuma notificação nova
                  </div>
                ) : (
                  <div className="divide-y">
                    {notificacoes.map((notif) => (
                      <div
                        key={notif.id}
                        className="p-4 hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => marcarComoLida(notif.id)}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg">{getNotificacaoIcon(notif.tipo)}</span>
                          <div className="flex-1 space-y-1">
                            <p className="font-medium text-sm">{notif.titulo}</p>
                            <p className="text-xs text-muted-foreground">{notif.mensagem}</p>
                            <p className="text-xs text-muted-foreground">{formatTempo(notif.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <div className="bg-primary rounded-full p-2">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">{user?.nome || 'Usuário'}</p>
                  <p className="text-xs text-muted-foreground">
                    {user?.matricula ? `Mat: ${user.matricula}` : 'Sem matrícula'}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>;
};