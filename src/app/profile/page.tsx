"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  ArrowLeft, 
  Save, 
  User, 
  Palette, 
  SlidersHorizontal, 
  Sparkles, 
  Check, 
  Info,
  CheckCircle2,
  Heart
} from "lucide-react";
import Link from 'next/link';
import { useLocalStorage, useUserScopedStorage, UserProfile, INITIAL_USER_PROFILE } from '@/lib/storage-hooks';
import { useToast } from "@/hooks/use-toast";

const STYLE_OPTIONS = ["Minimalista", "Bohemio", "Clásico", "Streetwear", "Romántico", "Vintage", "Deportivo"];
const COLORS_OPTIONS = ["Negro", "Blanco", "Azul", "Rojo", "Verde", "Pasteles", "Neutros"];
const BODY_FOCUS = ["Cintura", "Piernas", "Hombros", "Escote", "Brazos"];
const OCCASIONS = ["Trabajo", "Casual", "Eventos Noche", "Gimnasio", "Citas"];

export default function ProfilePage() {
  const [activeUser] = useLocalStorage<string>('estiliza_active_user', '');
  const [profile, setProfile] = useUserScopedStorage<UserProfile>('estiliza_profile', INITIAL_USER_PROFILE);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'basic' | 'style' | 'morphology'>('basic');
  const [formData, setFormData] = useState<UserProfile>(INITIAL_USER_PROFILE);

  useEffect(() => {
    setMounted(true);
    if (!activeUser) {
      router.push('/');
    }
  }, [activeUser, router]);

  // Sincronizar el perfil cargado al formulario
  useEffect(() => {
    if (profile && profile.name) {
      setFormData(profile);
    }
  }, [profile]);

  const toggleList = (category: keyof UserProfile['stylePreferences'], value: string) => {
    setFormData(prev => {
      const current = prev.stylePreferences[category] as string[];
      const updated = current.includes(value) 
        ? current.filter(item => item !== value)
        : [...current, value];
      return {
        ...prev,
        stylePreferences: {
          ...prev.stylePreferences,
          [category]: updated
        }
      };
    });
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Campo requerido",
        description: "Por favor, ingresa tu nombre de usuario.",
        variant: "destructive"
      });
      return;
    }

    setProfile(formData);
    
    toast({
      title: "¡Perfil Actualizado!",
      description: "Tus preferencias de estilo se han guardado con éxito localmente.",
    });

    router.push('/dashboard');
  };

  if (!mounted) return null;

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full p-6 space-y-8 pb-28">
      {/* Cabecera */}
      <header className="flex items-center gap-4 pt-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted/80">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-headline font-bold text-foreground">Editar tu Perfil</h1>
          <p className="text-[10px] text-primary uppercase tracking-widest font-black">Asesoría Pilar Catalán</p>
        </div>
      </header>

      {/* Pestañas de Navegación Estilizadas */}
      <div className="grid grid-cols-3 gap-2 bg-muted/40 p-1.5 rounded-2xl border border-muted-foreground/5 shadow-inner">
        <button
          onClick={() => setActiveTab('basic')}
          className={`flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'basic' 
              ? 'bg-white text-primary shadow-sm scale-[1.02]' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <User className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Datos</span>
        </button>
        <button
          onClick={() => setActiveTab('style')}
          className={`flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'style' 
              ? 'bg-white text-primary shadow-sm scale-[1.02]' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Palette className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Estilo</span>
        </button>
        <button
          onClick={() => setActiveTab('morphology')}
          className={`flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'morphology' 
              ? 'bg-white text-primary shadow-sm scale-[1.02]' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Morfología</span>
        </button>
      </div>

      {/* Contenido de las Pestañas */}
      <div className="space-y-6">
        {/* PESTAÑA 1: DATOS BÁSICOS */}
        {activeTab === 'basic' && (
          <Card className="border-none shadow-md rounded-3xl bg-white overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 p-6 border-b border-primary/5">
              <CardTitle className="text-base font-headline font-bold text-foreground flex items-center gap-2">
                <User className="w-5 h-5 text-primary" /> Datos del Perfil
              </CardTitle>
              <CardDescription className="text-xs">
                Modifica tu nombre de presentación y género para personalizar el asesoramiento.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Campo Nombre */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Tu Nombre</Label>
                <Input 
                  id="name" 
                  placeholder="Escribe tu nombre" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="h-12 rounded-xl border-muted bg-muted/5 font-bold focus-visible:ring-primary/20"
                />
              </div>

              {/* Selección de Género */}
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">¿Cuál es tu género?</Label>
                <RadioGroup 
                  value={formData.gender} 
                  onValueChange={(v: 'Femenino' | 'Masculino') => setFormData({...formData, gender: v})}
                  className="grid grid-cols-2 gap-4"
                >
                  <div 
                    onClick={() => setFormData({...formData, gender: 'Femenino'})}
                    className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      formData.gender === 'Femenino' 
                        ? 'border-primary bg-primary/5 shadow-sm scale-[1.01]' 
                        : 'border-muted bg-transparent hover:bg-muted/10'
                    }`}
                  >
                    <RadioGroupItem value="Femenino" id="femenino" className="text-primary border-primary" />
                    <Label htmlFor="femenino" className="font-bold cursor-pointer text-sm">Femenino</Label>
                  </div>
                  
                  <div 
                    onClick={() => setFormData({...formData, gender: 'Masculino'})}
                    className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      formData.gender === 'Masculino' 
                        ? 'border-primary bg-primary/5 shadow-sm scale-[1.01]' 
                        : 'border-muted bg-transparent hover:bg-muted/10'
                    }`}
                  >
                    <RadioGroupItem value="Masculino" id="masculino" className="text-primary border-primary" />
                    <Label htmlFor="masculino" className="font-bold cursor-pointer text-sm">Masculino</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="pt-2 flex items-start gap-2 text-left bg-primary/5 p-4 rounded-2xl border border-primary/10">
                <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  El género ayuda a la inteligencia artificial a curar y sugerir prendas que se ajusten de manera óptima a las proporciones de tu fisionomía.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* PESTAÑA 2: PREFERENCIAS DE ESTILO */}
        {activeTab === 'style' && (
          <div className="space-y-6">
            {/* Estilos Favoritos */}
            <Card className="border-none shadow-md rounded-3xl bg-white">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="text-base font-headline font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" /> Estilos Predilectos
                </CardTitle>
                <CardDescription className="text-xs">Selecciona los estilos con los que más te identificas.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="flex flex-wrap gap-2.5">
                  {STYLE_OPTIONS.map(style => {
                    const isSelected = formData.stylePreferences.preferredStyles.includes(style);
                    return (
                      <button
                        key={style}
                        onClick={() => toggleList('preferredStyles', style)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold border transition-all ${
                          isSelected 
                            ? 'bg-primary border-primary text-white shadow-md scale-[1.03]' 
                            : 'bg-muted/30 border-muted hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        {style}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Colores Predilectos */}
            <Card className="border-none shadow-md rounded-3xl bg-white">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="text-base font-headline font-bold text-foreground flex items-center gap-2">
                  <Palette className="w-5 h-5 text-primary" /> Paleta de Colores
                </CardTitle>
                <CardDescription className="text-xs">Tus tonalidades preferidas al vestir.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="flex flex-wrap gap-2.5">
                  {COLORS_OPTIONS.map(color => {
                    const isSelected = formData.stylePreferences.favoriteColors.includes(color);
                    return (
                      <button
                        key={color}
                        onClick={() => toggleList('favoriteColors', color)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold border transition-all ${
                          isSelected 
                            ? 'bg-secondary border-secondary text-white shadow-md scale-[1.03]' 
                            : 'bg-muted/30 border-muted hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        {color}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Ocasiones de Uso */}
            <Card className="border-none shadow-md rounded-3xl bg-white">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="text-base font-headline font-bold text-foreground flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" /> Ocasiones Frecuentes
                </CardTitle>
                <CardDescription className="text-xs">Contextos de uso más habituales en tu día a día.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="flex flex-wrap gap-2.5">
                  {OCCASIONS.map(occ => {
                    const isSelected = formData.stylePreferences.occasionPreferences.includes(occ);
                    return (
                      <button
                        key={occ}
                        onClick={() => toggleList('occasionPreferences', occ)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold border transition-all ${
                          isSelected 
                            ? 'bg-primary border-primary text-white shadow-md scale-[1.03]' 
                            : 'bg-muted/30 border-muted hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        {occ}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* PESTAÑA 3: MORFOLOGÍA */}
        {activeTab === 'morphology' && (
          <div className="space-y-6">
            <Card className="border-none shadow-md rounded-3xl bg-white overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 p-6 border-b border-primary/5">
                <CardTitle className="text-base font-headline font-bold text-foreground flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-primary" /> Configuración de Silueta
                </CardTitle>
                <CardDescription className="text-xs">
                  Alinea la inteligencia artificial con los puntos focales que deseas destacar o disimular en tu look.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-6 space-y-8">
                {/* Destacar */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Partes a destacar o acentuar:</Label>
                  <div className="flex flex-wrap gap-2.5">
                    {BODY_FOCUS.map(part => {
                      const isSelected = formData.stylePreferences.bodyPartsToAccentuate.includes(part);
                      return (
                        <button
                          key={part}
                          onClick={() => toggleList('bodyPartsToAccentuate', part)}
                          className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold border transition-all ${
                            isSelected 
                              ? 'bg-green-600 border-green-600 text-white shadow-md scale-[1.03]' 
                              : 'bg-muted/30 border-muted hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                          {part}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Disimular */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Partes a suavizar o disimular:</Label>
                  <div className="flex flex-wrap gap-2.5">
                    {BODY_FOCUS.map(part => {
                      const isSelected = formData.stylePreferences.bodyPartsToMinimize.includes(part);
                      return (
                        <button
                          key={part}
                          onClick={() => toggleList('bodyPartsToMinimize', part)}
                          className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold border transition-all ${
                            isSelected 
                              ? 'bg-pink-700 border-pink-700 text-white shadow-md scale-[1.03]' 
                              : 'bg-muted/30 border-muted hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                          {part}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Botón Flotante / Anclado de Guardar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/95 to-transparent p-6 max-w-2xl mx-auto w-full z-20">
        <Button 
          onClick={handleSave} 
          className="w-full h-14 bg-primary text-base font-bold shadow-2xl hover:scale-[1.01] transition-transform rounded-2xl flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" /> Guardar Cambios
        </Button>
      </div>
    </div>
  );
}
