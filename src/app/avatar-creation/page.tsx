
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalStorage, UserProfile, INITIAL_USER_PROFILE } from '@/lib/storage-hooks';
import { generateStylizedAvatar } from '@/ai/flows/generate-stylized-avatar';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Camera, User, Loader2, Image as ImageIcon, Sparkles, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';

export default function AvatarCreationPage() {
  const [profile, setProfile] = useLocalStorage<UserProfile>('estiliza_profile', INITIAL_USER_PROFILE);
  const [preferOpenAI] = useLocalStorage('prefer_openai', false);
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
        figurePhotoDataUri: figurePhoto,
        preferOpenAI: preferOpenAI
      });
      
      setGeneratedAvatar(result.avatarDataUri);
      setProfile({ ...profile, avatarDataUri: result.avatarDataUri });
      
      toast({
        title: "¡Avatar Creado!",
        description: "Tu modelo 3D ha sido generado con éxito.",
      });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error de Generación",
        description: error.message || "No se pudo generar el avatar. Verifica tus llaves de API en Ajustes.",
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
        <h1 className="text-3xl font-headline font-bold text-primary">Tu Yo Digital</h1>
        <p className="text-muted-foreground text-sm">Transformamos tus fotos reales en un avatar Pixar 3D.</p>
      </div>

      {!generatedAvatar ? (
        <div className="space-y-6">
          <Alert variant="default" className="bg-pink-50 border-pink-200">
            <Sparkles className="h-4 w-4 text-primary" />
            <AlertTitle className="text-primary font-bold">Generación con IA</AlertTitle>
            <AlertDescription className="text-xs">
              {preferOpenAI ? "Utilizando OpenAI DALL-E 3 para máxima fidelidad." : "Utilizando Google Gemini Multimodal."} 
              <Link href="/settings" className="underline font-bold ml-1">Configurar llaves</Link>
            </AlertDescription>
          </Alert>

          <Card className="border-dashed border-2 bg-white/50">
            <CardHeader className="text-center p-4">
              <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
                <User className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Foto de Rostro</CardTitle>
              <CardDescription className="text-xs">Para capturar tus facciones y peinado.</CardDescription>
            </CardHeader>
            <CardContent>
              {facePhoto ? (
                <div className="relative aspect-square w-full max-w-[200px] mx-auto rounded-xl overflow-hidden border-4 border-primary/20">
                  <Image src={facePhoto} alt="Face" fill className="object-cover" />
                  <Button variant="secondary" size="sm" className="absolute bottom-2 right-2 h-7" onClick={() => setFacePhoto(null)}>Cambiar</Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-40 bg-muted/20 rounded-xl cursor-pointer hover:bg-muted/30 transition-all border-2 border-dashed border-muted">
                  <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-xs font-bold uppercase tracking-wider">Subir Rostro</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'face')} />
                </label>
              )}
            </CardContent>
          </Card>

          <Card className="border-dashed border-2 bg-white/50">
            <CardHeader className="text-center p-4">
              <div className="mx-auto bg-secondary/10 p-3 rounded-full w-fit">
                <ImageIcon className="w-6 h-6 text-secondary" />
              </div>
              <CardTitle className="text-lg">Foto de Cuerpo</CardTitle>
              <CardDescription className="text-xs">Para capturar tu complexión y estilo.</CardDescription>
            </CardHeader>
            <CardContent>
              {figurePhoto ? (
                <div className="relative aspect-[3/4] w-full max-w-[200px] mx-auto rounded-xl overflow-hidden border-4 border-secondary/20">
                  <Image src={figurePhoto} alt="Figure" fill className="object-cover" />
                  <Button variant="secondary" size="sm" className="absolute bottom-2 right-2 h-7" onClick={() => setFigurePhoto(null)}>Cambiar</Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-40 bg-muted/20 rounded-xl cursor-pointer hover:bg-muted/30 transition-all border-2 border-dashed border-muted">
                  <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-xs font-bold uppercase tracking-wider">Subir Cuerpo</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'figure')} />
                </label>
              )}
            </CardContent>
          </Card>

          <Button 
            disabled={!facePhoto || !figurePhoto || generating} 
            onClick={handleGenerate}
            className="w-full h-16 bg-primary text-xl font-bold shadow-xl hover:scale-[1.02] transition-transform"
          >
            {generating ? (
              <><Loader2 className="mr-3 h-6 w-6 animate-spin" /> Creando Avatar...</>
            ) : (
              <><Sparkles className="mr-3 h-6 w-6" /> Generar Avatar Pixar</>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in zoom-in duration-500">
          <Card className="overflow-hidden shadow-2xl bg-white ring-[12px] ring-primary/5 rounded-[2rem]">
            <div className="relative aspect-[3/4] w-full bg-muted">
              <Image 
                src={generatedAvatar} 
                alt="3D Avatar Character" 
                fill 
                className="object-cover" 
                unoptimized={generatedAvatar.startsWith('data:')}
              />
            </div>
            <CardContent className="p-8 text-center space-y-3">
              <CardTitle className="text-3xl text-primary font-headline font-bold">¡Estás increíble!</CardTitle>
              <p className="text-muted-foreground italic">"Tu modelo 3D personalizado está listo para el probador virtual"</p>
            </CardContent>
          </Card>
          
          <div className="flex gap-4">
            <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setGeneratedAvatar(null)}>
              <RefreshCw className="mr-2 w-4 h-4" /> Reintentar
            </Button>
            <Button className="flex-1 bg-primary font-bold shadow-md h-12 rounded-xl" onClick={handleProceed}>
              Empezar a Estilizar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
