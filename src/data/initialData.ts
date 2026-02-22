import type { StockItem, AssemblyList, Product } from '@/types';

export const initialStockItems: StockItem[] = [
  {
    id: 'stk-001',
    name: 'Vis M6x20 inox',
    sku: 'VIS-M6-20',
    category: 'Visserie',
    quantity: 2500,
    minQuantity: 500,
    unit: 'pcs',
    location: 'A1-03',
    price: 0.05,
    createdAt: '2024-01-15',
  },
  {
    id: 'stk-002',
    name: 'Plaque aluminium 2mm',
    sku: 'ALU-PL-2',
    category: 'Matières premières',
    quantity: 45,
    minQuantity: 10,
    unit: 'm²',
    location: 'B2-01',
    price: 12.5,
    createdAt: '2024-01-20',
  },
  {
    id: 'stk-003',
    name: 'Roulement 6205',
    sku: 'RLT-6205',
    category: 'Composants',
    quantity: 120,
    minQuantity: 30,
    unit: 'pcs',
    location: 'C1-05',
    price: 4.8,
    createdAt: '2024-02-01',
  },
  {
    id: 'stk-004',
    name: 'Moteur DC 24V',
    sku: 'MOT-DC24',
    category: 'Composants',
    quantity: 8,
    minQuantity: 5,
    unit: 'pcs',
    location: 'D3-02',
    price: 45.0,
    createdAt: '2024-02-10',
  },
  {
    id: 'stk-005',
    name: 'Cable 2.5mm²',
    sku: 'CAB-25',
    category: 'Électrique',
    quantity: 350,
    minQuantity: 100,
    unit: 'm',
    location: 'E1-01',
    price: 1.2,
    createdAt: '2024-02-15',
  },
];

export const initialAssemblyLists: AssemblyList[] = [
  {
    id: 'asm-001',
    name: 'Assemblage Module A',
    productName: 'Module de commande A',
    description: 'Assemblage du module de commande principal',
    items: [
      { stockItemId: 'stk-001', quantity: 12 },
      { stockItemId: 'stk-002', quantity: 0.5 },
      { stockItemId: 'stk-003', quantity: 2 },
      { stockItemId: 'stk-004', quantity: 1 },
    ],
    createdAt: '2024-03-01',
  },
];

export const initialProducts: Product[] = [
  {
    id: 'prd-001',
    name: 'Module de commande A',
    sku: 'MOD-CMD-A',
    description: 'Module de commande principal assemblé',
    assemblyListId: 'asm-001',
    quantityProduced: 15,
    createdAt: '2024-03-15',
  },
];
