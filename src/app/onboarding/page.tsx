
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalStorage, useUserScopedStorage, INITIAL_USER_PROFILE, UserProfile } from '@/lib/storage-hooks';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const STYLE_OPTIONS = ["Minimalista", "Bohemio", "Clásico", "Streetwear", "Romántico", "Vintage", "Deportivo"];
const COLORS_OPTIONS = ["Negro", "Blanco", "Azul", "Rojo", "Verde", "Pasteles", "Neutros"];
const BODY_FOCUS = ["Cintura", "Piernas", "Hombros", "Escote", "Brazos"];
const OCCASIONS = ["Trabajo", "Casual", "Eventos Noche", "Gimnasio", "Citas"];

export default function OnboardingPage() {
  const [activeUser] = useLocalStorage<string>('estiliza_active_user', '');
  const [profile, setProfile] = useUserScopedStorage<UserProfile>('estiliza_profile', INITIAL_USER_PROFILE);
  const [step, setStep] = useState(1);
  const router = useRouter();

  // Nombre formateado para mostrar en la UI basado en el login
  const displayName = activeUser 
    ? activeUser.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : '';

  const [formData, setFormData] = useState<UserProfile>({
    ...INITIAL_USER_PROFILE,
    name: displayName
  });

  useEffect(() => {
    // Si no hay un usuario activo en el sistema, mandarlo al login
    if (!activeUser) {
      router.push('/');
      return;
    }
    
    // Si ya completó avatar y onboarding, al dashboard
    if (profile.onboardingComplete && profile.avatarDataUri) {
      router.push('/dashboard');
    }
  }, [activeUser, profile, router]);

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

  const nextStep = () => {
    if (step === 1 && !formData.name) return;
    setStep(s => s + 1);
  };
  
  const prevStep = () => setStep(s => s - 1);

  const finishOnboarding = () => {
    // Guardamos los datos y marcamos como completo de onboarding
    setProfile({ 
      ...formData, 
      onboardingComplete: true 
    });
    // Siguiente paso: El avatar es obligatorio antes del Dashboard
    router.push('/avatar-creation');
  };

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full p-6 space-y-8">
      <div className="space-y-2 text-center pt-8">
        <h1 className="text-3xl font-headline font-bold text-primary">Perfil de Estilo</h1>
        <p className="text-muted-foreground text-sm">Paso {step} de 3 para {formData.name}</p>
      </div>

      <Card className="shadow-lg border-none bg-white rounded-3xl overflow-hidden">
        <CardContent className="pt-8">
          {step === 1 && (
            <div className="space-y-8">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-primary">Tu Nombre</Label>
                <Input 
                  id="name" 
                  placeholder="Tu nombre" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary">¿Cuál es tu género?</Label>
                <RadioGroup 
                  value={formData.gender} 
                  onValueChange={(v: 'Femenino' | 'Masculino') => setFormData({...formData, gender: v})}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${formData.gender === 'Femenino' ? 'border-primary bg-primary/5' : 'border-muted bg-transparent'}`} onClick={() => setFormData({...formData, gender: 'Femenino'})}>
                    <RadioGroupItem value="Femenino" id="femenino" />
                    <Label htmlFor="femenino" className="font-bold cursor-pointer">Femenino</Label>
                  </div>
                  <div className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${formData.gender === 'Masculino' ? 'border-primary bg-primary/5' : 'border-muted bg-transparent'}`} onClick={() => setFormData({...formData, gender: 'Masculino'})}>
                    <RadioGroupItem value="Masculino" id="masculino" />
                    <Label htmlFor="masculino" className="font-bold cursor-pointer">Masculino</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary">¿Tus estilos favoritos?</Label>
                <div className="grid grid-cols-2 gap-3">
                  {STYLE_OPTIONS.map(style => (
                    <div key={style} className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => toggleList('preferredStyles', style)}>
                      <Checkbox checked={formData.stylePreferences.preferredStyles.includes(style)} />
                      <span className="text-sm font-medium">{style}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Tus colores predilectos:</Label>
                <div className="grid grid-cols-2 gap-3">
                  {COLORS_OPTIONS.map(color => (
                    <div key={color} className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => toggleList('favoriteColors', color)}>
                      <Checkbox checked={formData.stylePreferences.favoriteColors.includes(color)} />
                      <span className="text-sm font-medium">{color}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Ocasiones frecuentes:</Label>
                <div className="grid grid-cols-2 gap-3">
                  {OCCASIONS.map(occ => (
                    <div key={occ} className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => toggleList('occasionPreferences', occ)}>
                      <Checkbox checked={formData.stylePreferences.occasionPreferences.includes(occ)} />
                      <span className="text-sm font-medium">{occ}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary">¿Qué partes resaltar?</Label>
                <div className="grid grid-cols-2 gap-3">
                  {BODY_FOCUS.map(part => (
                    <div key={part} className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => toggleList('bodyPartsToAccentuate', part)}>
                      <Checkbox checked={formData.stylePreferences.bodyPartsToAccentuate.includes(part)} />
                      <span className="text-sm font-medium">{part}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary">¿Qué partes disimular?</Label>
                <div className="grid grid-cols-2 gap-3">
                  {BODY_FOCUS.map(part => (
                    <div key={part} className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => toggleList('bodyPartsToMinimize', part)}>
                      <Checkbox checked={formData.stylePreferences.bodyPartsToMinimize.includes(part)} />
                      <span className="text-sm font-medium">{part}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between gap-4 pb-10">
        {step > 1 && (
          <Button variant="outline" onClick={prevStep} className="flex-1 h-12 rounded-xl">Anterior</Button>
        )}
        {step < 3 ? (
          <Button onClick={nextStep} disabled={step === 1 && !formData.name} className="flex-1 h-12 rounded-xl bg-primary text-white font-bold">Siguiente</Button>
        ) : (
          <Button onClick={finishOnboarding} className="flex-1 h-12 rounded-xl bg-primary text-white font-bold shadow-lg">Finalizar Perfil</Button>
        )}
      </div>
    </div>
  );
}
