
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalStorage, UserProfile, INITIAL_USER_PROFILE } from '@/lib/storage-hooks';
import { generateStylizedAvatar } from '@/ai/flows/generate-stylized-avatar';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Camera, User, Loader2, Image as ImageIcon, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

export default function AvatarCreationPage() {
  const [profile, setProfile] = useLocalStorage<UserProfile>('estiliza_profile', INITIAL_USER_PROFILE);
  const [facePhoto, setFacePhoto] = useState<string | null>(null);
  const [figurePhoto, setFigurePhoto] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedAvatar, setGeneratedAvatar] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    if (profile.avatarDataUri) {
      setGeneratedAvatar(profile.avatarDataUri);
    }
  }, [profile.avatarDataUri]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'face' | 'figure') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (type === 'face') setFacePhoto(base64String);
        else setFigurePhoto(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!facePhoto || !figurePhoto) return;
    setGenerating(true);
    try {
      const result = await generateStylizedAvatar({
        facePhotoDataUri: facePhoto,
        figurePhotoDataUri: figurePhoto
      });
      setGeneratedAvatar(result.avatarDataUri);
      setProfile({ ...profile, avatarDataUri: result.avatarDataUri });
      
      if (result.isPlaceholder) {
        toast({
          title: "Avatar Generado (Modo Estándar)",
          description: "Hemos preparado una base 3D optimizada para tu probador virtual.",
        });
      } else {
        toast({
          title: "¡Avatar Personalizado Listo!",
          description: "Tu modelo 3D ha sido creado basándose en tus fotos.",
        });
      }
    } catch (error: any) {
      console.error("Error generating avatar", error);
      toast({
        variant: "destructive",
        title: "Error de Generación",
        description: "No se pudo crear el avatar. Inténtalo de nuevo.",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleProceed = () => {
    router.push('/dashboard');
  };

  if (!mounted) return null;

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full p-6 space-y-8 pb-20">
      <div className="space-y-2 text-center pt-8">
        <h1 className="text-3xl font-headline font-bold text-primary">Tu Avatar 3D</h1>
        <p className="text-muted-foreground text-sm">Convertimos tus fotos en un modelo para el probador virtual.</p>
      </div>

      {!generatedAvatar ? (
        <div className="grid gap-6">
          <Card className="border-dashed border-2 bg-white/50">
            <CardHeader className="text-center">
              <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
                <User className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-lg">Foto de Rostro</CardTitle>
              <CardDescription>Para capturar tus rasgos y cabello.</CardDescription>
            </Header>
            <CardContent>
              {facePhoto ? (
                <div className="relative aspect-square w-full rounded-lg overflow-hidden border">
                  <Image src={facePhoto} alt="Face" fill className="object-cover" />
                  <Button variant="secondary" size="sm" className="absolute bottom-2 right-2" onClick={() => setFacePhoto(null)}>Cambiar</Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-40 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium">Subir foto de cara</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'face')} />
                </label>
              )}
            </CardContent>
          </Card>

          <Card className="border-dashed border-2 bg-white/50">
            <CardHeader className="text-center">
              <div className="mx-auto bg-secondary/10 p-3 rounded-full w-fit">
                <ImageIcon className="w-8 h-8 text-secondary" />
              </div>
              <CardTitle className="text-lg">Foto de Cuerpo</CardTitle>
              <CardDescription>Para analizar tu silueta y proporciones.</CardDescription>
            </CardHeader>
            <CardContent>
              {figurePhoto ? (
                <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden border">
                  <Image src={figurePhoto} alt="Figure" fill className="object-cover" />
                  <Button variant="secondary" size="sm" className="absolute bottom-2 right-2" onClick={() => setFigurePhoto(null)}>Cambiar</Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-40 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium">Subir foto de cuerpo</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'figure')} />
                </label>
              )}
            </CardContent>
          </Card>

          <Button 
            disabled={!facePhoto || !figurePhoto || generating} 
            onClick={handleGenerate}
            className="w-full h-14 bg-primary text-lg font-bold shadow-lg"
          >
            {generating ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analizando y Creando...</>
            ) : (
              <><Sparkles className="mr-2 h-5 w-5" /> Generar Avatar Pixar-Style</>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="overflow-hidden shadow-2xl bg-white ring-8 ring-primary/10">
            <div className="relative aspect-[3/4] w-full bg-muted">
              <Image 
                src={generatedAvatar} 
                alt="3D Avatar Character" 
                fill 
                className="object-cover" 
                unoptimized={generatedAvatar.startsWith('data:')}
                data-ai-hint="3d character"
              />
            </div>
            <CardContent className="p-6 text-center space-y-2">
              <CardTitle className="text-2xl text-primary font-headline">Tu Yo Virtual</CardTitle>
              <p className="text-sm text-muted-foreground italic">"Listo para probarte las mejores combinaciones"</p>
            </CardContent>
          </Card>
          
          <div className="flex gap-4">
            <Button variant="outline" className="flex-1" onClick={() => setGeneratedAvatar(null)}>Regenerar</Button>
            <Button className="flex-1 bg-primary font-bold shadow-md" onClick={handleProceed}>Empezar a Estilizar</Button>
          </div>
        </div>
      )}
    </div>
  );
}
