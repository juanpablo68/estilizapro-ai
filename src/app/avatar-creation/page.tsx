"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalStorage, UserProfile, INITIAL_USER_PROFILE } from '@/lib/storage-hooks';
import { generateStylizedAvatar } from '@/ai/flows/generate-stylized-avatar';
import { analyzeStyleContext } from '@/ai/flows/analyze-style-context';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Image as ImageIcon, Loader2, Sparkles, RefreshCw, Brain, CheckCircle, Settings, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';

const resizeImage = (base64Str: string, maxWidth = 800, maxHeight = 1200): Promise<string> => {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
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
        const optimized = await resizeImage(base64String, 600, 800);
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

    const localKey = localStorage.getItem('openai_api_key');
    const openaiKey = localKey && localKey.trim() !== '' ? localKey : undefined;

    setLoading(true);
    try {
      setLoadingStatus('Iniciando Análisis Quirúrgico...');
      const analysis = await analyzeStyleContext({
        facePhotoDataUri: facePhoto,
        figurePhotoDataUri: figurePhoto,
        openaiApiKey: openaiKey
      });

      const updatedProfile = { 
        ...profile, 
        biometricData: analysis.biometricData,
        figureAnalysis: analysis.figureAnalysis, 
        colorimetryAnalysis: analysis.colorimetryAnalysis 
      };
      
      setProfile(updatedProfile);

      setLoadingStatus('Generando Avatar 3D (DALL-E)...');
      const result = await generateStylizedAvatar({
        biometricData: analysis.biometricData,
        openaiApiKey: openaiKey
      });
      
      if (!result.avatarDataUri) {
        throw new Error("No se pudo obtener la imagen del avatar.");
      }

      setLoadingStatus('Optimizando Imagen...');
      const optimizedAvatar = await resizeImage(result.avatarDataUri, 800, 1000);
      
      setGeneratedAvatar(optimizedAvatar);
      setProfile({ ...updatedProfile, avatarDataUri: optimizedAvatar });
      
      toast({
        title: "¡Diagnóstico Finalizado!",
        description: "Tu fisionomía real ha sido cargada en el Asistente.",
      });
    } catch (error: any) {
      console.error("Procesamiento Avatar Error:", error);
      toast({
        variant: "destructive",
        title: "Error de IA",
        description: error.message || "No se pudo conectar con el motor de IA.",
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

  const eyes = profile.biometricData?.rostro?.ojos?.color_detalle || 'Detectando...';
  const hair = profile.biometricData?.rostro?.cabello?.color_natural || 'Detectando...';
  const skin = profile.biometricData?.colorimetria?.tono_piel || 'Detectando...';

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full p-6 space-y-8 pb-20">
      <header className="flex items-center justify-between pt-8">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
             <Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft /></Button>
          </Link>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-headline font-bold text-primary leading-none">Esencia Biométrica</h1>
            <p className="text-muted-foreground text-[10px] uppercase font-black tracking-widest">Diagnóstico Real</p>
          </div>
        </div>
        <Link href="/settings">
          <Button variant="outline" size="sm" className="rounded-xl border-primary text-primary font-bold gap-2 bg-white hover:bg-primary/5 shadow-sm">
            <Settings className="w-4 h-4" /> Configuración
          </Button>
        </Link>
      </header>

      {!generatedAvatar ? (
        <div className="space-y-6 animate-in fade-in duration-500">
          <Alert className="bg-primary/5 border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
            <AlertTitle className="text-primary font-bold">Diagnóstico de Alta Fidelidad</AlertTitle>
            <AlertDescription className="text-xs">
              La IA analizará quirúrgicamente el matiz de tus ojos, cabello y silueta para personalizar cada consejo de vestuario.
            </AlertDescription>
          </Alert>

          <Card className="border-dashed border-2 bg-white/50">
                <CardHeader className="text-center p-4">
                    <CardTitle className="text-lg">Fotos de Referencia</CardTitle>
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
                                <span className="text-[10px] font-bold uppercase">Rostro</span>
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
                                <span className="text-[10px] font-bold uppercase">Cuerpo</span>
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
              <><Brain className="mr-3 h-6 w-6" /> Iniciar Diagnóstico</>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in zoom-in duration-500">
          <Card className="overflow-hidden shadow-2xl bg-white ring-[12px] ring-primary/5 rounded-[2.5rem]">
            <div className="relative aspect-[3/4] w-full bg-muted">
              <Image 
                src={generatedAvatar} 
                alt="Avatar" 
                fill 
                className="object-contain p-4" 
                unoptimized
              />
            </div>
            <CardContent className="p-6 text-center space-y-4">
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-200">
                <CheckCircle className="w-3 h-3" /> Identidad Sincronizada
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">
                  Ojos: {eyes} • Cabello: {hair}
                </p>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest leading-relaxed">
                  Tono de Piel: {skin}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex gap-4">
            <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setGeneratedAvatar(null)}>
              <RefreshCw className="mr-2 w-4 h-4" /> Re-analizar
            </Button>
            <Button className="flex-1 bg-primary font-bold shadow-md h-12 rounded-xl" onClick={handleProceed}>
              Ir al Dashboard →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
