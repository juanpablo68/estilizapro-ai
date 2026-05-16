"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalStorage, UserProfile, INITIAL_USER_PROFILE } from '@/lib/storage-hooks';
import { generateStylizedAvatar } from '@/ai/flows/generate-stylized-avatar';
import { analyzeStyleContext } from '@/ai/flows/analyze-style-context';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Image as ImageIcon, Loader2, Sparkles, RefreshCw, Brain, CheckCircle, ArrowLeft, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';

const resizeImageForAction = (base64Str: string, maxWidth = 512, maxHeight = 512): Promise<string> => {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
      } else {
        if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.6));
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
    if (profile.avatarDataUri) setGeneratedAvatar(profile.avatarDataUri);
  }, [profile.avatarDataUri]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'face' | 'figure') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'face') setFacePhoto(reader.result as string);
        else setFigurePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcess = async () => {
    if (!facePhoto || !figurePhoto) {
      toast({ variant: "destructive", title: "Fotos Requeridas", description: "Necesitamos ver tu rostro y cuerpo." });
      return;
    }

    const openaiKey = localStorage.getItem('openai_api_key') || undefined;
    setLoading(true);
    try {
      setLoadingStatus('Comprimiendo fotos...');
      const lightFace = await resizeImageForAction(facePhoto);
      const lightFigure = await resizeImageForAction(figurePhoto);

      setLoadingStatus('Análisis Biométrico...');
      const analysis = await analyzeStyleContext({
        facePhotoDataUri: lightFace,
        figurePhotoDataUri: lightFigure,
        openaiApiKey: openaiKey
      });

      const updatedProfile = { 
        ...profile, 
        biometricData: analysis.biometricData,
        figureAnalysis: analysis.figureAnalysis, 
        colorimetryAnalysis: analysis.colorimetryAnalysis,
        gender: analysis.biometricData.genero // Sincronización de género detectado
      };
      setProfile(updatedProfile);

      setLoadingStatus('Creando Avatar Realista...');
      const result = await generateStylizedAvatar({
        biometricData: analysis.biometricData,
        openaiApiKey: openaiKey,
        userId: profile.name || 'user'
      });
      
      setGeneratedAvatar(result.imageUrl);
      setProfile({ ...updatedProfile, avatarDataUri: result.imageUrl });
      toast({ title: "¡Diagnóstico Completo!", description: "Tu identidad ha sido generada con éxito." });
    } catch (error: any) {
      console.error("Avatar Creation Error:", error);
      toast({ variant: "destructive", title: "Error de IA", description: error.message || "Error al conectar con el servidor." });
    } finally {
      setLoading(false);
      setLoadingStatus('');
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full p-6 space-y-8 pb-20">
      <header className="flex items-center justify-between pt-8">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
             <Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft /></Button>
          </Link>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-headline font-bold text-primary leading-none">Esencia Biométrica</h1>
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Diagnóstico Real</p>
          </div>
        </div>
      </header>

      {!generatedAvatar ? (
        <div className="space-y-6 animate-in fade-in duration-500">
          <Alert className="bg-primary/5 border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
            <AlertTitle className="text-primary font-bold">Diagnóstico de Alta Fidelidad</AlertTitle>
            <AlertDescription className="text-xs">
              La IA analizará quirúrgicamente tus rasgos para personalizar tu avatar y consejos.
            </AlertDescription>
          </Alert>

          <Card className="border-dashed border-2 bg-white/50">
                <CardHeader className="text-center p-4">
                    <CardTitle className="text-lg">Fotos de Referencia</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center gap-6">
                    <div className="space-y-2 text-center">
                        {facePhoto ? (
                            <div className="relative h-40 w-32 rounded-lg overflow-hidden border-2 border-primary">
                                <Image src={facePhoto} alt="Face" fill className="object-cover" unoptimized />
                                <Button variant="secondary" size="icon" className="absolute top-1 right-1 h-6 w-6 rounded-full" onClick={() => setFacePhoto(null)}>×</Button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center h-40 w-32 bg-muted/20 rounded-lg cursor-pointer border-2 border-dashed">
                                <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                                <span className="text-[10px] font-bold uppercase">Rostro</span>
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'face')} />
                            </label>
                        )}
                    </div>
                    <div className="space-y-2 text-center">
                        {figurePhoto ? (
                            <div className="relative h-40 w-32 rounded-lg overflow-hidden border-2 border-primary">
                                <Image src={figurePhoto} alt="Figure" fill className="object-cover" unoptimized />
                                <Button variant="secondary" size="icon" className="absolute top-1 right-1 h-6 w-6 rounded-full" onClick={() => setFigurePhoto(null)}>×</Button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center h-40 w-32 bg-muted/20 rounded-lg cursor-pointer border-2 border-dashed">
                                <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                                <span className="text-[10px] font-bold uppercase">Cuerpo</span>
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'figure')} />
                            </label>
                        )}
                    </div>
                </CardContent>
          </Card>

          <Button disabled={!facePhoto || !figurePhoto || loading} onClick={handleProcess} className="w-full h-16 bg-primary text-xl font-bold shadow-xl rounded-2xl">
            {loading ? <><Loader2 className="mr-3 h-6 w-6 animate-spin" /> {loadingStatus}</> : <><Brain className="mr-3 h-6 w-6" /> Iniciar Diagnóstico</>}
          </Button>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in zoom-in duration-500">
          <Card className="overflow-hidden shadow-2xl bg-white ring-[12px] ring-primary/5 rounded-[2.5rem]">
            <div className="relative aspect-[3/4] w-full bg-muted">
              <Image src={generatedAvatar} alt="Avatar" fill className="object-contain p-4" unoptimized />
            </div>
            <CardContent className="p-6 text-center space-y-4">
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-200">
                <CheckCircle className="w-3 h-3" /> Identidad Sincronizada
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center justify-center gap-2">
                  <User className="w-3 h-3" /> Género: {profile.biometricData?.genero || 'Detectado'}
                </p>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">
                  Ojos: {profile.biometricData?.rostro?.ojos?.color_detalle || 'Detectado'} • Cabello: {profile.biometricData?.rostro?.cabello?.color_natural || 'Detectado'}
                </p>
              </div>
            </CardContent>
          </Card>
          <div className="flex gap-4">
            <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setGeneratedAvatar(null)}>
              <RefreshCw className="mr-2 w-4 h-4" /> Re-analizar
            </Button>
            <Button className="flex-1 bg-primary font-bold shadow-md h-12 rounded-xl" onClick={() => router.push('/dashboard')}>
              Ir al Dashboard →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
