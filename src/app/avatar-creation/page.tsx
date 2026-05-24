
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserScopedStorage, UserProfile, INITIAL_USER_PROFILE, saveHeavyImage, loadHeavyImage } from '@/lib/storage-hooks';
import { generateStylizedAvatar } from '@/ai/flows/generate-stylized-avatar';
import { analyzeStyleContext } from '@/ai/flows/analyze-style-context';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Image as ImageIcon, Loader2, Sparkles, RefreshCw, Brain, CheckCircle, ArrowLeft, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { db } from '@/lib/local-db';

const resizeImageForAction = (base64Str: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
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
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
  });
};

export default function AvatarCreationPage() {
  const [profile, setProfile] = useUserScopedStorage<UserProfile>('estiliza_profile', INITIAL_USER_PROFILE);
  const [facePhoto, setFacePhoto] = useState<string | null>(null);
  const [figurePhoto, setFigurePhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const userSlug = profile.name ? profile.name.toLowerCase().replace(/\s+/g, '_') : 'user';

  useEffect(() => {
    setMounted(true);
    const loadSavedAvatar = async () => {
      if (profile.avatarDataUri && profile.avatarDataUri.startsWith('avatar-')) {
        const url = await loadHeavyImage(profile.avatarDataUri);
        if (url) setAvatarUrl(url);
      } else if (profile.avatarDataUri) {
        setAvatarUrl(profile.avatarDataUri);
      }
    };
    loadSavedAvatar();
  }, [profile.avatarDataUri]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'face' | 'figure') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const optimized = await resizeImageForAction(reader.result as string);
        if (type === 'face') setFacePhoto(optimized);
        else setFigurePhoto(optimized);
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
      setLoadingStatus('Analizando Identidad...');
      const lightFace = await resizeImageForAction(facePhoto);
      const lightFigure = await resizeImageForAction(figurePhoto);

      const analysis = await analyzeStyleContext({
        facePhotoDataUri: lightFace,
        figurePhotoDataUri: lightFigure,
        openaiApiKey: openaiKey
      });

      const userSelectedGender = profile.gender || 'Femenino';
      
      setLoadingStatus('Generando Avatar...');
      const result = await generateStylizedAvatar({
        biometricData: { ...analysis.biometricData, genero: userSelectedGender }, 
        openaiApiKey: openaiKey,
        userId: userSlug
      });
      
      const avatarImageData = result.imageUrl;

      // 1. Guardar imágenes pesadas en IndexedDB
      console.log("Saving images to IndexedDB...");
      const faceId = await saveHeavyImage(userSlug, 'face', lightFace);
      const figureId = await saveHeavyImage(userSlug, 'figure', lightFigure);
      const avatarId = await saveHeavyImage(userSlug, 'avatar', avatarImageData);

      // 2. Guardar análisis detallado en IndexedDB
      await db.analyses.put({
        id: `analysis-${userSlug}-${Date.now()}`,
        userId: userSlug,
        type: 'biometric',
        data: analysis.biometricData,
        createdAt: Date.now()
      });

      setAvatarUrl(URL.createObjectURL(dataURItoBlob(avatarImageData)));
      
      // 3. Guardar solo metadatos livianos en localStorage
      const finalProfileToSave: UserProfile = { 
        ...profile,
        avatarDataUri: avatarId, // Solo el ID
        detectedFeatures: {
          skinTone: analysis.biometricData.colorimetria?.tono_piel || 'Natural',
          hairColor: analysis.biometricData.rostro?.cabello?.color_natural || 'Natural',
          eyeColor: analysis.biometricData.rostro?.ojos?.color_detalle || 'Natural'
        },
        onboardingComplete: true
      };

      setProfile(finalProfileToSave);
      toast({ title: "¡Identidad Generada!", description: `Avatar ${userSelectedGender} listo y guardado localmente.` });
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
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.push('/dashboard')}><ArrowLeft /></Button>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-headline font-bold text-primary leading-none">Esencia Biométrica</h1>
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Paso Final: Avatar</p>
          </div>
        </div>
      </header>

      {!avatarUrl ? (
        <div className="space-y-6 animate-in fade-in duration-500">
          <Alert className="bg-primary/5 border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
            <AlertTitle className="text-primary font-bold">Diagnóstico de Identidad</AlertTitle>
            <AlertDescription className="text-xs">
              Tus imágenes se guardarán solo en la memoria de este equipo para tu privacidad.
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

          <Button disabled={!facePhoto || !figurePhoto || loading} onClick={handleProcess} className="w-full h-16 bg-primary text-xl font-bold shadow-xl rounded-2xl transition-all active:scale-95">
            {loading ? <><Loader2 className="mr-3 h-6 w-6 animate-spin" /> {loadingStatus}</> : <><Brain className="mr-3 h-6 w-6" /> Crear Avatar {profile.gender === 'Masculino' ? 'Masculino' : 'Femenino'}</>}
          </Button>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in zoom-in duration-500">
          <Card className="overflow-hidden shadow-2xl bg-white ring-[12px] ring-primary/5 rounded-[2.5rem]">
            <div className="relative aspect-[3/4] w-full bg-muted">
              <Image src={avatarUrl} alt="Avatar" fill className="object-contain p-4" unoptimized />
            </div>
            <CardContent className="p-6 text-center space-y-4">
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-200">
                <CheckCircle className="w-3 h-3" /> Memoria Local Protegida
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center justify-center gap-2">
                  <User className="w-3 h-3" /> Perfil: {profile.gender}
                </p>
                {profile.detectedFeatures && (
                  <div className="text-[10px] font-black text-primary uppercase tracking-widest leading-relaxed mt-2 border-t pt-2 border-primary/10">
                    <p>Piel: {profile.detectedFeatures.skinTone}</p>
                    <p>Cabello: {profile.detectedFeatures.hairColor}</p>
                    <p>Ojos: {profile.detectedFeatures.eyeColor}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <div className="flex gap-4">
            <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setAvatarUrl(null)}>
              <RefreshCw className="mr-2 w-4 h-4" /> Re-generar
            </Button>
            <Button className="flex-1 bg-primary font-bold shadow-md h-12 rounded-xl" onClick={() => router.push('/dashboard')}>
              Finalizar y entrar →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
