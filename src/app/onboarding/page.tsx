"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalStorage, INITIAL_USER_PROFILE, UserProfile } from '@/lib/storage-hooks';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

const STYLE_OPTIONS = ["Minimalista", "Bohemio", "Clásico", "Streetwear", "Romántico", "Vintage", "Deportivo"];
const COLORS_OPTIONS = ["Negro", "Blanco", "Azul", "Rojo", "Verde", "Pasteles", "Neutros"];
const BODY_FOCUS = ["Cintura", "Piernas", "Hombros", "Escote", "Brazos"];
const OCCASIONS = ["Trabajo", "Casual", "Eventos Noche", "Gimnasio", "Citas"];

export default function OnboardingPage() {
  const [profile, setProfile] = useLocalStorage<UserProfile>('estiliza_profile', INITIAL_USER_PROFILE);
  const [step, setStep] = useState(1);
  const router = useRouter();

  const [formData, setFormData] = useState<UserProfile>(profile);

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

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const finishOnboarding = () => {
    setProfile({ ...formData, onboardingComplete: true });
    router.push('/avatar-creation');
  };

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full p-6 space-y-8">
      <div className="space-y-2 text-center pt-8">
        <h1 className="text-3xl font-headline font-bold text-primary">Conozcámonos</h1>
        <p className="text-muted-foreground text-sm">Paso {step} de 3</p>
      </div>

      <Card className="shadow-lg border-none">
        <CardContent className="pt-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">¿Cómo te llamas?</Label>
                <Input 
                  id="name" 
                  placeholder="Tu nombre" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-4">
                <Label>¿Cuáles son tus estilos favoritos?</Label>
                <div className="grid grid-cols-2 gap-3">
                  {STYLE_OPTIONS.map(style => (
                    <div key={style} className="flex items-center space-x-2 p-3 bg-muted rounded-lg cursor-pointer" onClick={() => toggleList('preferredStyles', style)}>
                      <Checkbox checked={formData.stylePreferences.preferredStyles.includes(style)} />
                      <span className="text-sm">{style}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <Label>Tus colores predilectos:</Label>
                <div className="grid grid-cols-2 gap-3">
                  {COLORS_OPTIONS.map(color => (
                    <div key={color} className="flex items-center space-x-2 p-3 bg-muted rounded-lg cursor-pointer" onClick={() => toggleList('favoriteColors', color)}>
                      <Checkbox checked={formData.stylePreferences.favoriteColors.includes(color)} />
                      <span className="text-sm">{color}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <Label>¿Qué ocasiones son más comunes para ti?</Label>
                <div className="grid grid-cols-2 gap-3">
                  {OCCASIONS.map(occ => (
                    <div key={occ} className="flex items-center space-x-2 p-3 bg-muted rounded-lg cursor-pointer" onClick={() => toggleList('occasionPreferences', occ)}>
                      <Checkbox checked={formData.stylePreferences.occasionPreferences.includes(occ)} />
                      <span className="text-sm">{occ}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <Label>¿Qué partes de tu cuerpo te gusta resaltar?</Label>
                <div className="grid grid-cols-2 gap-3">
                  {BODY_FOCUS.map(part => (
                    <div key={part} className="flex items-center space-x-2 p-3 bg-muted rounded-lg cursor-pointer" onClick={() => toggleList('bodyPartsToAccentuate', part)}>
                      <Checkbox checked={formData.stylePreferences.bodyPartsToAccentuate.includes(part)} />
                      <span className="text-sm">{part}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <Label>¿Qué partes prefieres disimular?</Label>
                <div className="grid grid-cols-2 gap-3">
                  {BODY_FOCUS.map(part => (
                    <div key={part} className="flex items-center space-x-2 p-3 bg-muted rounded-lg cursor-pointer" onClick={() => toggleList('bodyPartsToMinimize', part)}>
                      <Checkbox checked={formData.stylePreferences.bodyPartsToMinimize.includes(part)} />
                      <span className="text-sm">{part}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between gap-4">
        {step > 1 && (
          <Button variant="outline" onClick={prevStep} className="flex-1">Anterior</Button>
        )}
        {step < 3 ? (
          <Button onClick={nextStep} className="flex-1 bg-primary text-white">Siguiente</Button>
        ) : (
          <Button onClick={finishOnboarding} className="flex-1 bg-primary text-white">Finalizar Perfil</Button>
        )}
      </div>
    </div>
  );
}
