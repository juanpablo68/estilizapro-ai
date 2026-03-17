"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalStorage, UserProfile, INITIAL_USER_PROFILE } from '@/lib/storage-hooks';
import { generateStylizedAvatar } from '@/ai/flows/generate-stylized-avatar';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Camera, User, Loader2, Image as ImageIcon, Sparkles, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

export default function AvatarCreationPage() {
  const [profile, setProfile] = useLocalStorage<UserProfile>('estiliza_profile', INITIAL_USER_PROFILE);
  const [facePhoto, setFacePhoto] = useState<string | null>(null);
  const [figurePhoto, setFigurePhoto] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedAvatar, setGeneratedAvatar] = useState<string | null>(profile.avatarDataUri || null);
  const router = useRouter();
  const { toast } = useToast();

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
      toast({
        title: "¡Avatar Creado!",
        description: "Tu avatar estilizado está listo para el probador.",
      });
    } catch (error: any) {
      console.error("Error generating avatar", error);
      toast({
        variant: "destructive",
        title: "Error de Servicio",
        description: "No se pudo generar el avatar en este momento.",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleProceed = () => {
    router.push('/dashboard');
  };

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full p-6 space-y-8 pb-20">
      <div className="space-y-2 text-center pt-8">
        <h1 className="text-3xl font-headline font-bold text-primary">Tu Avatar Estilizado</h1>
        <p className="text-muted-foreground text-sm">Creamos una versión virtual de ti para visualizar tus looks.</p>
      </div>

      {!generatedAvatar ? (
        <div className="grid gap-6">
          <Card className="border-dashed border-2">
            <CardHeader className="text-center">
              <div className="mx-auto bg-muted p-3 rounded-full w-fit">
                <User className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-lg">Foto de Rostro</CardTitle>
              <CardDescription>Una foto clara de tu cara mirando al frente.</CardDescription>
            </CardHeader>
            <CardContent>
              {facePhoto ? (
                <div className="relative aspect-square w-full rounded-lg overflow-hidden border">
                  <Image src={facePhoto} alt="Face" fill className="object-cover" />
                  <Button variant="secondary" size="sm" className="absolute bottom-2 right-2" onClick={() => setFacePhoto(null)}>Cambiar</Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-40 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium">Subir o tomar foto</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'face')} />
                </label>
              )}
            </CardContent>
          </Card>

          <Card className="border-dashed border-2">
            <CardHeader className="text-center">
              <div className="mx-auto bg-muted p-3 rounded-full w-fit">
                <ImageIcon className="w-8 h-8 text-secondary" />
              </div>
              <CardTitle className="text-lg">Foto de Figura</CardTitle>
              <CardDescription>Una foto de cuerpo completo para analizar tu figura.</CardDescription>
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
                  <span className="text-sm font-medium">Subir o tomar foto</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'figure')} />
                </label>
              )}
            </CardContent>
          </Card>

          <Button 
            disabled={!facePhoto || !figurePhoto || generating} 
            onClick={handleGenerate}
            className="w-full h-14 bg-primary text-lg"
          >
            {generating ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Procesando Avatar...</>
            ) : (
              <><Sparkles className="mr-2 h-5 w-5" /> Crear mi Avatar Estilizado</>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="overflow-hidden shadow-2xl bg-white ring-4 ring-primary/20">
            <div className="relative aspect-[3/4] w-full bg-muted">
              <Image 
                src={generatedAvatar} 
                alt="Generated Avatar" 
                fill 
                className="object-cover" 
                data-ai-hint="3d character"
              />
            </div>
            <CardContent className="p-6 text-center space-y-2">
              <CardTitle className="text-2xl text-primary">¡Este es tu Avatar!</CardTitle>
              <p className="text-sm text-muted-foreground">Lo usaremos para mostrarte cómo te quedan tus prendas.</p>
            </CardContent>
          </Card>
          
          <div className="flex gap-4">
            <Button variant="outline" className="flex-1" onClick={() => setGeneratedAvatar(null)}>Regenerar</Button>
            <Button className="flex-1 bg-primary" onClick={handleProceed}>Empezar a Estilizar</Button>
          </div>
        </div>
      )}
    </div>
  );
}
