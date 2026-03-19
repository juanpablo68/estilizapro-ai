
"use client"

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Key, ShoppingBag, Pin, Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import Link from 'next/link';
import { useLocalStorage, UserProfile, INITIAL_USER_PROFILE } from '@/lib/storage-hooks';
import { useToast } from "@/hooks/use-toast";
import { testAPIConnection } from '@/ai/flows/test-api-flow';

export default function SettingsPage() {
  const [profile, setProfile] = useLocalStorage<UserProfile>('estiliza_profile', INITIAL_USER_PROFILE);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  const [openaiKey, setOpenaiKey] = useState('');
  const [pinterestToken, setPinterestToken] = useState('');
  const [shopifyDomain, setShopifyDomain] = useState('');
  const [shopifyToken, setShopifyToken] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    setMounted(true);
    setOpenaiKey(localStorage.getItem('openai_api_key') || '');
    setPinterestToken(localStorage.getItem('pinterest_token') || '');
    setShopifyDomain(localStorage.getItem('shopify_domain') || '');
    setShopifyToken(localStorage.getItem('shopify_token') || '');
  }, []);

  const handleSaveAll = () => {
    localStorage.setItem('openai_api_key', openaiKey);
    localStorage.setItem('pinterest_token', pinterestToken);
    localStorage.setItem('shopify_domain', shopifyDomain);
    localStorage.setItem('shopify_token', shopifyToken);
    
    toast({
      title: "Configuración Guardada",
      description: "Pipeline de IA (OpenAI + Pinterest + Shopify) actualizado.",
    });
  };

  const handleTest = async () => {
    if (!openaiKey) {
      toast({ variant: "destructive", title: "OpenAI Key Requerida" });
      return;
    }
    setTestStatus('loading');
    const result = await testAPIConnection({ provider: 'openai', apiKey: openaiKey });
    setTestStatus(result.success ? 'success' : 'error');
    toast({ 
      title: result.success ? "¡Éxito!" : "Error", 
      description: result.message,
      variant: result.success ? "default" : "destructive"
    });
  };

  if (!mounted) return null;

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full p-6 space-y-8 pb-24">
      <header className="flex items-center gap-4 pt-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon"><ArrowLeft /></Button>
        </Link>
        <h1 className="text-2xl font-headline font-bold text-primary">Conexiones de IA</h1>
      </header>

      <div className="space-y-6">
        {/* OpenAI Card */}
        <Card className="border-none shadow-md">
          <CardHeader className="bg-primary/5 p-4">
            <CardTitle className="text-sm flex items-center gap-2 text-primary font-bold uppercase tracking-wider">
              <Key className="w-4 h-4" /> OpenAI (Cerebro GPT-4o)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex gap-2">
              <Input 
                type="password" 
                value={openaiKey} 
                onChange={e => setOpenaiKey(e.target.value)} 
                placeholder="sk-..." 
                className="flex-1"
              />
              <Button variant="outline" size="sm" onClick={handleTest}>
                {testStatus === 'loading' ? <Loader2 className="animate-spin h-4 w-4" /> : "Probar"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pinterest Card */}
        <Card className="border-none shadow-md">
          <CardHeader className="bg-red-50 p-4">
            <CardTitle className="text-sm flex items-center gap-2 text-red-600 font-bold uppercase tracking-wider">
              <Pin className="w-4 h-4" /> Pinterest API (Inspiración)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Input 
              type="password" 
              value={pinterestToken} 
              onChange={e => setPinterestToken(e.target.value)} 
              placeholder="Access Token de Pinterest" 
            />
          </CardContent>
        </Card>

        {/* Shopify Card */}
        <Card className="border-none shadow-md">
          <CardHeader className="bg-green-50 p-4">
            <CardTitle className="text-sm flex items-center gap-2 text-green-600 font-bold uppercase tracking-wider">
              <ShoppingBag className="w-4 h-4" /> Shopify API (Productos)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <Input 
              value={shopifyDomain} 
              onChange={e => setShopifyDomain(e.target.value)} 
              placeholder="tu-tienda.myshopify.com" 
            />
            <Input 
              type="password" 
              value={shopifyToken} 
              onChange={e => setShopifyToken(e.target.value)} 
              placeholder="Storefront Access Token" 
            />
          </CardContent>
        </Card>
      </div>

      <Button onClick={handleSaveAll} className="w-full h-14 bg-primary text-lg font-bold shadow-xl rounded-2xl">
        <Save className="mr-2" /> Guardar Todo el Pipeline
      </Button>
    </div>
  );
}
