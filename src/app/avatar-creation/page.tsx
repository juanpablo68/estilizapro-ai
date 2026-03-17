
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalStorage, UserProfile, INITIAL_USER_PROFILE } from '@/lib/storage-hooks';
import { generateStylizedAvatar } from '@/ai/flows/generate-stylized-avatar';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Camera, User, Loader2, Image as ImageIcon, Sparkles, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
          title: "Modelo Base Activado",
          description: "Hemos asignado un avatar Pixar optimizado para tu probador virtual.",
        });
      } else {
        toast({
          title: "¡Avatar Personalizado!",
          description: "Tu modelo 3D ha sido creado exitosamente.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error de Conexión",
        description: "Usa un avatar predefinido para continuar.",
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
        <p className="text-muted-foreground text-sm">Preparamos tu modelo para el probador virtual.</p>
      </div>

      {!generatedAvatar ? (
        <div className="grid gap-6">
          <Alert variant="default" className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Privacidad Local</AlertTitle>
            <AlertDescription className="text-blue-700 text-xs">
              Tus fotos se analizan para crear el avatar pero no se guardan en ningún servidor.
            </AlertDescription>
          </Alert>

          <Card className="border-dashed border-2 bg-white/50">
            <CardHeader className="text-center p-4">
              <div className="mx-auto bg-primary/10 p-2 rounded-full w-fit">
                <User className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-md">Foto de Rostro</CardTitle>
            </CardHeader>
            <CardContent>
              {facePhoto ? (
                <div className="relative aspect-square w-full max-w-[200px] mx-auto rounded-lg overflow-hidden border">
                  <Image src={facePhoto} alt="Face" fill className="object-cover" />
                  <Button variant="secondary" size="sm" className="absolute bottom-2 right-2 h-7" onClick={() => setFacePhoto(null)}>Cambiar</Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-32 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <Camera className="w-6 h-6 text-muted-foreground mb-1" />
                  <span className="text-xs font-medium">Subir cara</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'face')} />
                </label>
              )}
            </CardContent>
          </Card>

          <Card className="border-dashed border-2 bg-white/50">
            <CardHeader className="text-center p-4">
              <div className="mx-auto bg-secondary/10 p-2 rounded-full w-fit">
                <ImageIcon className="w-6 h-6 text-secondary" />
              </div>
              <CardTitle className="text-md">Foto de Cuerpo</CardTitle>
            </CardHeader>
            <CardContent>
              {figurePhoto ? (
                <div className="relative aspect-[3/4] w-full max-w-[200px] mx-auto rounded-lg overflow-hidden border">
                  <Image src={figurePhoto} alt="Figure" fill className="object-cover" />
                  <Button variant="secondary" size="sm" className="absolute bottom-2 right-2 h-7" onClick={() => setFigurePhoto(null)}>Cambiar</Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-32 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <Camera className="w-6 h-6 text-muted-foreground mb-1" />
                  <span className="text-xs font-medium">Subir cuerpo</span>
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
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creando Avatar...</>
            ) : (
              <><Sparkles className="mr-2 h-5 w-5" /> Generar Yo Virtual</>
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
                data-ai-hint="3d animated character"
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
