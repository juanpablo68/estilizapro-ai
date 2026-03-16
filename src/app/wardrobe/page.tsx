"use client"

import { useState } from 'react';
import { useLocalStorage, WardrobeItem } from '@/lib/storage-hooks';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Plus, Trash2, ArrowLeft, Shirt } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';

export default function WardrobePage() {
  const [items, setItems] = useLocalStorage<WardrobeItem[]>('estiliza_wardrobe', []);
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', type: 'top', imageDataUri: '' });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewItem({ ...newItem, imageDataUri: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const addItem = () => {
    if (!newItem.name || !newItem.imageDataUri) return;
    const item: WardrobeItem = {
      ...newItem,
      id: crypto.randomUUID(),
      dateAdded: new Date().toISOString(),
    };
    setItems([item, ...items]);
    setAdding(false);
    setNewItem({ name: '', type: 'top', imageDataUri: '' });
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full p-6 space-y-6 pb-20">
      <header className="flex items-center gap-4 pt-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon"><ArrowLeft /></Button>
        </Link>
        <h1 className="text-2xl font-headline font-bold">Mi Armario</h1>
      </header>

      {adding ? (
        <Card className="border-none shadow-xl bg-card">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-bold text-lg">Añadir Prenda</h2>
            
            <div className="space-y-4">
              <div className="relative aspect-square w-full max-w-[250px] mx-auto bg-muted rounded-xl flex items-center justify-center overflow-hidden border">
                {newItem.imageDataUri ? (
                  <Image src={newItem.imageDataUri} alt="Preview" fill className="object-cover" />
                ) : (
                  <label className="cursor-pointer flex flex-col items-center">
                    <Camera className="w-10 h-10 text-muted-foreground mb-2" />
                    <span className="text-xs">Tomar Foto</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  </label>
                )}
              </div>

              <div className="space-y-2">
                <Label>Nombre de la prenda</Label>
                <Input placeholder="Ej: Jeans Azules" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
              </div>

              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select value={newItem.type} onValueChange={v => setNewItem({...newItem, type: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de prenda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Superior (Camiseta, Blusa)</SelectItem>
                    <SelectItem value="bottom">Inferior (Pantalón, Falda)</SelectItem>
                    <SelectItem value="dress">Vestido</SelectItem>
                    <SelectItem value="outerwear">Exterior (Chaqueta, Abrigo)</SelectItem>
                    <SelectItem value="shoe">Calzado</SelectItem>
                    <SelectItem value="accessory">Accesorio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setAdding(false)}>Cancelar</Button>
                <Button className="flex-1 bg-primary" onClick={addItem}>Guardar</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Button onClick={() => setAdding(true)} className="w-full h-12 bg-primary shadow-lg sticky top-4 z-10">
            <Plus className="mr-2" /> Nueva Prenda
          </Button>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="p-8 bg-muted rounded-full">
                <Shirt className="w-16 h-16 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground max-w-[200px]">Tu armario está vacío. ¡Empieza a fotografiar tu ropa!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {items.map(item => (
                <Card key={item.id} className="overflow-hidden border-none shadow-sm group">
                  <div className="relative aspect-square bg-muted">
                    <Image src={item.imageDataUri} alt={item.name} fill className="object-cover" />
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                      onClick={() => deleteItem(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <CardContent className="p-3">
                    <p className="font-medium text-xs truncate">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{item.type}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
