
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Shirt, 
  Layers, 
  MessageCircle, 
  UserCircle, 
  Sparkles,
  Instagram,
  Scissors,
  LogOut,
  User,
  Database
} from "lucide-react";
import { useLocalStorage, useUserScopedStorage, UserProfile, INITIAL_USER_PROFILE, loadHeavyImage } from '@/lib/storage-hooks';
import Image from 'next/image';
import Link from 'next/link';
import { logStorageStatus } from '@/lib/local-db';

export default function DashboardPage() {
  const router = useRouter();
  const [, setActiveUser] = useLocalStorage<string>('estiliza_active_user', 'default');
  const [profile] = useUserScopedStorage<UserProfile>('estiliza_profile', INITIAL_USER_PROFILE);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    logStorageStatus();
    
    const loadAvatar = async () => {
      if (profile.avatarDataUri && profile.avatarDataUri.startsWith('avatar-')) {
        const url = await loadHeavyImage(profile.avatarDataUri);
        if (url) setAvatarUrl(url);
      } else if (profile.avatarDataUri) {
        setAvatarUrl(profile.avatarDataUri);
      }
    };
    loadAvatar();
  }, [profile.avatarDataUri]);

  const handleLogout = () => {
    setActiveUser('default');
    localStorage.removeItem('estiliza_auth');
    router.push('/');
  };

  const actions = [
    { name: 'Armario', icon: Shirt, color: 'text-primary', bg: 'bg-primary/10', href: '/wardrobe' },
    { name: 'Cápsulas', icon: Layers, color: 'text-secondary', bg: 'bg-secondary/10', href: '/capsules' },
    { name: 'Peinado y Maquillaje', icon: Scissors, color: 'text-primary', bg: 'bg-primary/10', href: '/grooming' },
    { name: 'Asistente de Vestuario', icon: MessageCircle, color: 'text-primary', bg: 'bg-primary/5', href: '/chat' },
    { name: 'Probador Virtual', icon: UserCircle, color: 'text-secondary', bg: 'bg-secondary/5', href: '/preview' },
    { name: 'Ajustes', icon: LogOut, color: 'text-primary', bg: 'bg-primary/5', href: '/settings' },
  ];

  if (!mounted) return null;

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full p-6 space-y-8 pb-10">
      <header className="flex items-center justify-between pt-8">
        <div>
          <h1 className="text-2xl font-headline font-bold text-foreground">Hola, {profile.name || 'Usuario'}</h1>
          <p className="text-sm text-muted-foreground">Persistencia local activa</p>
        </div>
        <div className="flex items-center gap-2">
           <div className="flex flex-col items-end mr-2">
             <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sesión de</span>
             <span className="text-xs font-bold text-primary truncate max-w-[100px]">{profile.name || 'User'}</span>
           </div>
           <Button 
             variant="ghost" 
             size="icon" 
             onClick={handleLogout} 
             className="rounded-full text-destructive hover:bg-destructive/10"
             title={`Cerrar sesión de ${profile.name}`}
           >
             <LogOut className="w-5 h-5" />
           </Button>
           <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-primary shadow-sm bg-muted cursor-pointer" onClick={() => router.push('/avatar-creation')}>
            {avatarUrl ? (
                <Image src={avatarUrl} alt="Avatar" fill className="object-cover" unoptimized />
            ) : (
                <UserCircle className="w-full h-full text-muted-foreground p-1" />
            )}
           </div>
        </div>
      </header>

      <section className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-6 text-white shadow-lg overflow-hidden relative">
        <Sparkles className="absolute top-[-10px] right-[-10px] w-24 h-24 opacity-10 rotate-12" />
        <div className="relative z-10 space-y-2">
          <h2 className="text-xl font-bold">Asesoría personalizada Pilar Catalán</h2>
          <div className="pt-2">
            <Link href="https://instagram.com/by.pilarcatalan" target="_blank">
              <Button variant="secondary" size="sm" className="rounded-xl font-bold gap-2">
                <Instagram className="w-4 h-4" /> @by.pilarcatalan
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => (
          <Card 
            key={action.name} 
            className="hover:shadow-md transition-shadow cursor-pointer border-none" 
            onClick={() => router.push(action.href)}
          >
            <CardContent className="p-6 flex flex-col items-center justify-center space-y-3">
              <div className={`p-4 rounded-2xl ${action.bg}`}>
                <action.icon className={`w-8 h-8 ${action.color}`} />
              </div>
              <span className="font-bold text-sm text-center text-foreground">{action.name}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <footer className="text-center pt-8 space-y-2 border-t mt-4 pt-6">
        <div className="inline-flex items-center gap-2 bg-muted/50 px-4 py-1.5 rounded-full">
          <Database className="w-3 h-3 text-muted-foreground" />
          <p className="text-xs text-muted-foreground font-medium">Almacenamiento: <span className="font-bold">IndexedDB Master</span></p>
        </div>
        <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-black block pt-2">
          EstilizaPro AI v2.0 • Blindaje Local Multiusuario • Pilar Catalán
        </p>
      </footer>
    </div>
  );
}
