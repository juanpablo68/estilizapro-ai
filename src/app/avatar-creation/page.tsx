
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalStorage, UserProfile, INITIAL_USER_PROFILE } from '@/lib/storage-hooks';
import { generateStylizedAvatar } from '@/ai/flows/generate-stylized-avatar';
import { analyzeStyleContext } from '@/ai/flows/analyze-style-context';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Image as ImageIcon, Loader2, Sparkles, RefreshCw, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';

const resizeImage = (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 640;
      const MAX_HEIGHT = 640;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
  });
};

export default function AvatarCreationPage() {
  const [profile, setProfile] = useLocalStorage<UserProfile>('estiliza_profile', INITIAL_USER_PROFILE);
  const [facePhoto, setFacePhoto] = useState<string | null>(null);
  const [figurePhoto, setFigurePhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'face' | 'figure') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const optimized = await resizeImage(base64String);
        if (type === 'face') setFacePhoto(optimized);
        else setFigurePhoto(optimized);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcess = async () => {
    if (!facePhoto || !figurePhoto) {
      toast({
        variant: "destructive",
        title: "Fotos Requeridas",
        description: "Necesitamos ver tu rostro y cuerpo para el análisis maestro.",
      });
      return;
    }

    const openaiKey = localStorage.getItem('openai_api_key') || undefined;

    setLoading(true);
    try {
      setLoadingStatus('Razonamiento GPT-4o analizando tu esencia...');
      const analysis = await analyzeStyleContext({
        facePhotoDataUri: facePhoto,
        figurePhotoDataUri: figurePhoto,
        openaiApiKey: openaiKey
      });

      const updatedProfile = { 
        ...profile, 
        figureAnalysis: analysis.figureAnalysis, 
        colorimetryAnalysis: analysis.colorimetryAnalysis 
      };
      setProfile(updatedProfile);

      setLoadingStatus('DALL-E 3 creando tu avatar Pixar...');
      const result = await generateStylizedAvatar({
        visualDescription: analysis.visualDescription,
        openaiApiKey: openaiKey
      });
      
      setGeneratedAvatar(result.avatarDataUri);
      setProfile({ ...updatedProfile, avatarDataUri: result.avatarDataUri });
      
      toast({
        title: "¡Proceso Completado!",
        description: "Análisis y Arte por OpenAI finalizado con éxito.",
      });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error en Procesamiento",
        description: error.message || "Revisa tus APIs en Ajustes.",
      });
    } finally {
      setLoading(false);
      setLoadingStatus('');
    }
  };

  const handleProceed = () => {
    router.push('/dashboard');
  };

  if (!mounted) return null;

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full p-6 space-y-8 pb-20">
      <div className="space-y-2 text-center pt-8">
        <h1 className="text-3xl font-headline font-bold text-primary">Esencia Estilizada</h1>
        <p className="text-muted-foreground text-sm">OpenAI analiza tu esencia y crea tu imagen Pixar.</p>
      </div>

      {!generatedAvatar ? (
        <div className="space-y-6 animate-in fade-in duration-500">
          <Alert className="bg-primary/5 border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
            <AlertTitle className="text-primary font-bold">Pure OpenAI Architecture</AlertTitle>
            <AlertDescription className="text-xs">
              Sube tus fotos para que GPT-4o y DALL-E 3 trabajen juntos en tu perfil.
              <Link href="/settings" className="block mt-1 font-bold underline">Configurar OpenAI Key</Link>
            </AlertDescription>
          </Alert>

          <Card className="border-dashed border-2 bg-white/50">
                <CardHeader className="text-center p-4">
                    <CardTitle className="text-lg">Tus Fotos de Referencia</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center gap-6">
                    <div className="space-y-2 text-center">
                        {facePhoto ? (
                            <div className="relative h-40 w-32 rounded-lg overflow-hidden border-2 border-primary shadow-sm">
                                <Image src={facePhoto} alt="Face" fill className="object-cover" />
                                <Button variant="secondary" size="icon" className="absolute top-1 right-1 h-6 w-6 rounded-full" onClick={() => setFacePhoto(null)}>×</Button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center h-40 w-32 bg-muted/20 rounded-lg cursor-pointer border-2 border-dashed hover:bg-muted/30 transition-colors">
                                <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                                <span className="text-[10px] font-bold">ROSTRO</span>
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'face')} />
                            </label>
                        )}
                    </div>

                    <div className="space-y-2 text-center">
                        {figurePhoto ? (
                            <div className="relative h-40 w-32 rounded-lg overflow-hidden border-2 border-primary shadow-sm">
                                <Image src={figurePhoto} alt="Figure" fill className="object-cover" />
                                <Button variant="secondary" size="icon" className="absolute top-1 right-1 h-6 w-6 rounded-full" onClick={() => setFigurePhoto(null)}>×</Button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center h-40 w-32 bg-muted/20 rounded-lg cursor-pointer border-2 border-dashed hover:bg-muted/30 transition-colors">
                                <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                                <span className="text-[10px] font-bold">CUERPO</span>
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'figure')} />
                            </label>
                        )}
                    </div>
                </CardContent>
          </Card>

          <Button 
            disabled={!facePhoto || !figurePhoto || loading} 
            onClick={handleProcess}
            className="w-full h-16 bg-primary text-xl font-bold shadow-xl rounded-2xl"
          >
            {loading ? (
              <><Loader2 className="mr-3 h-6 w-6 animate-spin" /> {loadingStatus}</>
            ) : (
              <><Brain className="mr-3 h-6 w-6" /> Iniciar Análisis GPT-4o</>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in zoom-in duration-500">
          <Card className="overflow-hidden shadow-2xl bg-white ring-[12px] ring-primary/5 rounded-[2rem]">
            <div className="relative aspect-[3/4] w-full bg-muted">
              <Image 
                src={generatedAvatar} 
                alt="3D Avatar Pixar Style" 
                fill 
                className="object-cover" 
                unoptimized
              />
            </div>
            <CardContent className="p-8 text-center space-y-3">
              <CardTitle className="text-2xl text-primary font-headline font-bold">¡Tu Avatar Pixar!</CardTitle>
              <div className="flex justify-center gap-2">
                <span className="text-[10px] bg-secondary/10 text-secondary px-3 py-1 rounded-full font-bold uppercase tracking-wider">Figura: {profile.figureAnalysis}</span>
                <span className="text-[10px] bg-primary/10 text-primary px-3 py-1 rounded-full font-bold uppercase tracking-wider">Color: {profile.colorimetryAnalysis}</span>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex gap-4">
            <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setGeneratedAvatar(null)}>
              <RefreshCw className="mr-2 w-4 h-4" /> Nuevo Avatar
            </Button>
            <Button className="flex-1 bg-primary font-bold shadow-md h-12 rounded-xl" onClick={handleProceed}>
              Ir al Dashboard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
