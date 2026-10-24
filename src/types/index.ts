import type { Spec } from '@/lib/lcsc';

export interface StockItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  supplier: string;
  supplierRef: string;
  supplierLink: string;
  imageUrl: string;
  quantity: number;
  minQuantity: number;
  unit: string;
  location: string;
  price: number;
  createdAt: string;
  updatedAt: string;
  // Composants fields
  componentValue?: string;
  componentVoltage?: string;
  componentFootprint?: string;
  // Visserie fields
  screwType?: string;
  screwLength?: string;
  screwShape?: string;
  link?: string;
  // N° fournisseur
  lcscPart?: string;
  specs?: Spec[];
}
