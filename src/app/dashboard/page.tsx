"use client"

import { useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Shirt, 
  Layers, 
  MessageCircle, 
  UserCircle, 
  PlusCircle, 
  Settings,
  Sparkles
} from "lucide-react";
import { useLocalStorage, UserProfile, INITIAL_USER_PROFILE } from '@/lib/storage-hooks';
import Image from 'next/image';

export default function DashboardPage() {
  const router = useRouter();
  const [profile] = useLocalStorage<UserProfile>('estiliza_profile', INITIAL_USER_PROFILE);

  const actions = [
    { name: 'Armario', icon: Shirt, color: 'text-primary', bg: 'bg-primary/10', href: '/wardrobe' },
    { name: 'Cápsulas', icon: Layers, color: 'text-secondary', bg: 'bg-secondary/10', href: '/capsules' },
    { name: 'Estilista', icon: MessageCircle, color: 'text-pink-600', bg: 'bg-pink-50', href: '/chat' },
    { name: 'Probador Virtual', icon: UserCircle, color: 'text-indigo-600', bg: 'bg-indigo-50', href: '/preview' },
    { name: 'Más Cápsulas', icon: PlusCircle, color: 'text-orange-600', bg: 'bg-orange-50', href: '/purchase' },
    { name: 'Ajustes API', icon: Settings, color: 'text-slate-600', bg: 'bg-slate-50', href: '/settings' },
  ];

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full p-6 space-y-8 pb-10">
      <header className="flex items-center justify-between pt-8">
        <div>
          <h1 className="text-2xl font-headline font-bold text-foreground">Hola, {profile.name || 'Invitado'}</h1>
          <p className="text-sm text-muted-foreground">¿Qué vamos a estilizar hoy?</p>
        </div>
        <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-primary shadow-sm bg-muted cursor-pointer" onClick={() => router.push('/avatar-creation')}>
          {profile.avatarDataUri ? (
            <Image src={profile.avatarDataUri} alt="Avatar" fill className="object-cover" />
          ) : (
            <UserCircle className="w-full h-full text-muted-foreground p-1" />
          )}
        </div>
      </header>

      <section className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-6 text-white shadow-lg overflow-hidden relative">
        <Sparkles className="absolute top-[-10px] right-[-10px] w-24 h-24 opacity-10 rotate-12" />
        <div className="relative z-10 space-y-2">
          <h2 className="text-xl font-bold">Asistente de Pilar Cifuentes</h2>
          <p className="text-sm opacity-90">Análisis listo: Eres tipo <strong>{profile.figureAnalysis || 'Reloj de Arena'}</strong> con paleta <strong>{profile.colorimetryAnalysis || 'Otoño Cálido'}</strong>.</p>
          <Button variant="secondary" size="sm" className="mt-2" onClick={() => router.push('/capsules')}>
            Ver Sugerencia Diaria
          </Button>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => (
          <Card key={action.name} className="hover:shadow-md transition-shadow cursor-pointer border-none" onClick={() => router.push(action.href)}>
            <CardContent className="p-6 flex flex-col items-center justify-center space-y-3">
              <div className={`p-4 rounded-2xl ${action.bg}`}>
                <action.icon className={`w-8 h-8 ${action.color}`} />
              </div>
              <span className="font-medium text-sm text-foreground">{action.name}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <footer className="text-center pt-8 space-y-2">
        <p className="text-xs text-muted-foreground">Asesoría personalizada: @by.pilarcatalan</p>
        <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold">EstilizaPro AI v1.0 - Local Storage Mode</p>
      </footer>
    </div>
  );
}
