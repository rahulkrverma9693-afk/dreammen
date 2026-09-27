import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package, AlertTriangle, ArrowUpRight, ArrowDownRight, RefreshCw,
  Plus, Search, Filter, Edit2, RotateCcw, Truck, FileText, CheckCircle2,
  Building2, ArrowRightLeft, Layers, Check, X, ShieldAlert, Tag, Phone,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/cn';

// ─── Types ────────────────────────────────────────────────────
interface Product {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  price: number;
  stockQty: number;
  minStockLevel: number;
  unit: string;
  taxRate: number;
  isActive: boolean;
}

interface InhouseItem {
  id: string;
  name: string;
  unit: string;
  description?: string;
  poolStock: Array<{ id: string; quantity: number }>;
  stationStocks: Array<{
    id: string;
    quantity: number;
    employee: { id: string; name: string; role: string };
  }>;
}

interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  gstin?: string;
  purchaseOrders: Array<{ id: string; poNumber: string; status: string; totalAmount: number; orderedAt: string }>;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: string;
  totalAmount: number;
  notes?: string;
  orderedAt: string;
  receivedAt?: string;
  supplier: { id: string; name: string; phone?: string };
  items: Array<{ id: string; itemName: string; quantity: number; unit: string; unitPrice: number; totalPrice: number }>;
}

interface Movement {
  id: string;
  type: 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'TRANSFER';
  quantity: number;
  reason?: string;
  createdAt: string;
  product: { id: string; name: string; sku?: string; unit: string };
}

// ─── Product Modal ────────────────────────────────────────────
function ProductModal({
  product, onClose, onSaved,
}: { product: Product | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!product;
  const [form, setForm] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    description: product?.description || '',
    price: product?.price?.toString() || '',
    stockQty: product?.stockQty?.toString() || '0',
    minStockLevel: product?.minStockLevel?.toString() || '5',
    unit: product?.unit || 'unit',
    taxRate: product?.taxRate?.toString() || '18',
  });

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit
      ? api.patch(`/inventory/products/${product!.id}`, data)
      : api.post('/inventory/products', data),
    onSuccess: () => {
      toast.success(isEdit ? 'Product updated' : 'Product added to inventory');
      onSaved();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to save product'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate({
      ...form,
      price: parseFloat(form.price),
      stockQty: parseInt(form.stockQty),
      minStockLevel: parseInt(form.minStockLevel),
      taxRate: parseFloat(form.taxRate),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-up">
      <div className="bg-white rounded-card shadow-2xl border border-primary-100 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-rose-gradient text-white p-4 flex items-center justify-between">
          <h3 className="font-heading font-bold text-lg text-white">
            {isEdit ? 'Edit Product' : 'Add New Retail Product'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 bg-white">
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide">Product Name *</label>
            <input required type="text" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g., L'Oréal Keratin Shampoo 250ml" className="input-field" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide">SKU / Barcode</label>
              <input type="text" value={form.sku}
                onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                placeholder="SKU-1001" className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide">Selling Price (₹) *</label>
              <input required type="number" step={1} min={0} value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="850" className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide">Initial Stock Qty</label>
              <input type="number" min={0} value={form.stockQty}
                onChange={e => setForm(f => ({ ...f, stockQty: e.target.value }))}
                className="input-field" disabled={isEdit} />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide">Min Stock Alert Level</label>
              <input type="number" min={1} value={form.minStockLevel}
                onChange={e => setForm(f => ({ ...f, minStockLevel: e.target.value }))}
                className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide">Unit</label>
              <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className="input-field">
                <option value="unit">unit / bottle</option>
                <option value="pack">pack</option>
                <option value="box">box</option>
                <option value="ml">ml</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide">GST Tax Rate (%)</label>
              <input type="number" min={0} value={form.taxRate}
                onChange={e => setForm(f => ({ ...f, taxRate: e.target.value }))}
                className="input-field" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Optional notes or details…" className="input-field h-16 resize-none" />
          </div>

          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-button border border-gray-300 text-sm font-semibold text-text-secondary hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 btn-primary flex items-center justify-center gap-2">
              {mutation.isPending ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
              {isEdit ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Stock Adjustment Modal ───────────────────────────────────
function StockAdjustModal({
  product, onClose, onSaved,
}: { product: Product; onClose: () => void; onSaved: () => void }) {
  const [adjustmentType, setAdjustmentType] = useState<'ADD' | 'SUBTRACT'>('ADD');
  const [quantity, setQuantity] = useState('5');
  const [reason, setReason] = useState('Restock purchase');

  const mutation = useMutation({
    mutationFn: (data: any) => api.patch(`/inventory/products/${product.id}`, data),
    onSuccess: () => {
      toast.success('Stock adjusted successfully');
      onSaved();
    },
    onError: () => toast.error('Failed to adjust stock'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate({
      adjustmentType,
      adjustmentQty: parseInt(quantity),
      adjustmentReason: reason,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-up">
      <div className="bg-white rounded-card shadow-2xl border border-primary-100 max-w-md w-full overflow-hidden flex flex-col">
        <div className="bg-rose-gradient text-white p-4 flex items-center justify-between">
          <h3 className="font-heading font-bold text-lg text-white">Adjust Stock: {product.name}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 text-white"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white">
          <div className="p-3 bg-rose-50 rounded-card border border-primary-100 flex items-center justify-between text-sm">
            <span className="text-text-secondary font-medium">Current Stock:</span>
            <span className="font-bold text-text-primary text-base">{product.stockQty} {product.unit}s</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setAdjustmentType('ADD')}
              className={`py-2 rounded-input border text-xs font-bold transition-all ${adjustmentType === 'ADD' ? 'bg-green-600 text-white border-green-600 shadow-xs' : 'border-gray-200 text-text-secondary hover:border-gray-300'}`}>
              + Restock (Add)
            </button>
            <button type="button" onClick={() => setAdjustmentType('SUBTRACT')}
              className={`py-2 rounded-input border text-xs font-bold transition-all ${adjustmentType === 'SUBTRACT' ? 'bg-red-600 text-white border-red-600 shadow-xs' : 'border-gray-200 text-text-secondary hover:border-gray-300'}`}>
              - Deduct (Remove)
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide">Quantity *</label>
            <input required type="number" min={1} value={quantity} onChange={e => setQuantity(e.target.value)} className="input-field" />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide">Reason / Note</label>
            <input type="text" value={reason} onChange={e => setReason(e.target.value)}
              placeholder="e.g. Received from supplier, Damaged stock, Audit count" className="input-field" />
          </div>

          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-button border border-gray-300 text-sm font-semibold text-text-secondary">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 btn-primary flex items-center justify-center gap-2">
              {mutation.isPending ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />} Save Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Transfer Pool → Station Modal ────────────────────────────
function TransferModal({
  inhouseItem, onClose, onSaved,
}: { inhouseItem: InhouseItem; onClose: () => void; onSaved: () => void }) {
  const [employeeId, setEmployeeId] = useState('');
  const [quantity, setQuantity] = useState('100');
  const [reason, setReason] = useState('Weekly workstation allocation');

  // Fetch employees
  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const r = await api.get('/employees');
      return r.data.data;
    },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/inventory/transfer', data),
    onSuccess: () => {
      toast.success('Transferred from Pool to Station successfully!');
      onSaved();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Transfer failed'),
  });

  const poolQty = inhouseItem.poolStock[0]?.quantity || 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeId) { toast.error('Select a stylist / workstation'); return; }
    mutation.mutate({
      inhouseItemId: inhouseItem.id,
      employeeId,
      quantity: parseFloat(quantity),
      reason,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-up">
      <div className="bg-white rounded-card shadow-2xl border border-primary-100 max-w-md w-full overflow-hidden flex flex-col">
        <div className="bg-rose-gradient text-white p-4 flex items-center justify-between">
          <h3 className="font-heading font-bold text-lg text-white">Transfer: {inhouseItem.name}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 text-white"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white">
          <div className="p-3 bg-rose-50 rounded-card border border-primary-100 flex items-center justify-between text-sm">
            <span className="text-text-secondary font-medium">Available in Pool Stock:</span>
            <span className="font-bold text-primary text-base">{poolQty} {inhouseItem.unit}</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide">Select Stylist Workstation *</label>
            <select required value={employeeId} onChange={e => setEmployeeId(e.target.value)} className="input-field">
              <option value="">Select Stylist…</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide">Transfer Quantity ({inhouseItem.unit}) *</label>
            <input required type="number" step={1} min={1} max={poolQty} value={quantity} onChange={e => setQuantity(e.target.value)} className="input-field" />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide">Reason / Note</label>
            <input type="text" value={reason} onChange={e => setReason(e.target.value)} className="input-field" />
          </div>

          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-button border border-gray-300 text-sm font-semibold text-text-secondary">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 btn-primary flex items-center justify-center gap-2">
              {mutation.isPending ? <RefreshCw size={16} className="animate-spin" /> : <ArrowRightLeft size={16} />} Confirm Transfer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Inventory Page ──────────────────────────────────────
export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'retail' | 'inhouse' | 'suppliers' | 'movements'>('retail');
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [transferringItem, setTransferringItem] = useState<InhouseItem | null>(null);

  // Queries
  const { data: products = [], isLoading: prodLoading } = useQuery<Product[]>({
    queryKey: ['products', search, lowStockOnly],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (lowStockOnly) params.append('lowStock', 'true');
      const r = await api.get(`/inventory/products?${params.toString()}`);
      return r.data.data;
    },
  });

  const { data: inhouseItems = [], isLoading: inhouseLoading } = useQuery<InhouseItem[]>({
    queryKey: ['inhouse-inventory'],
    queryFn: async () => {
      const r = await api.get('/inventory/inhouse');
      return r.data.data;
    },
    enabled: activeTab === 'inhouse',
  });

  const { data: suppliers = [], isLoading: suppLoading } = useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const r = await api.get('/inventory/suppliers');
      return r.data.data;
    },
    enabled: activeTab === 'suppliers',
  });

  const { data: movements = [], isLoading: movLoading } = useQuery<Movement[]>({
    queryKey: ['movements'],
    queryFn: async () => {
      const r = await api.get('/inventory/movements');
      return r.data.data;
    },
    enabled: activeTab === 'movements',
  });

  // Low stock products count
  const lowStockCount = products.filter(p => p.stockQty <= p.minStockLevel).length;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-text-primary">Inventory & Consumables</h1>
          <p className="text-text-secondary text-sm mt-0.5">
            Retail product stock, inhouse consumables pool-to-station transfers, & supplier management
          </p>
        </div>
        {activeTab === 'retail' && (
          <button
            onClick={() => { setEditingProduct(null); setShowProductModal(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> Add Product
          </button>
        )}
      </div>

      {/* Low Stock Warning Alert */}
      {lowStockCount > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-card flex items-center justify-between gap-4 animate-fade-up">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-amber-600 shrink-0" size={24} />
            <div>
              <h4 className="font-heading font-bold text-sm text-amber-900">
                Low Stock Warning ({lowStockCount} items below minimum level)
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Some retail products are running low. Restock soon to prevent stockouts during customer billing.
              </p>
            </div>
          </div>
          <button
            onClick={() => { setActiveTab('retail'); setLowStockOnly(true); }}
            className="px-3 py-1.5 bg-amber-600 text-white rounded-button text-xs font-bold hover:bg-amber-700 transition-colors shrink-0 shadow-xs"
          >
            Filter Low Stock Items
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-glass p-4 rounded-card flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 rounded-card text-primary">
            <Package size={20} />
          </div>
          <div>
            <div className="text-xl font-bold text-text-primary font-heading">{products.length}</div>
            <div className="text-xs text-text-secondary">Retail Products</div>
          </div>
        </div>

        <div className="card-glass p-4 rounded-card flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 rounded-card text-amber-600">
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="text-xl font-bold text-amber-600 font-heading">{lowStockCount}</div>
            <div className="text-xs text-text-secondary">Low Stock Items</div>
          </div>
        </div>

        <div className="card-glass p-4 rounded-card flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 rounded-card text-blue-600">
            <Layers size={20} />
          </div>
          <div>
            <div className="text-xl font-bold text-text-primary font-heading">{inhouseItems.length}</div>
            <div className="text-xs text-text-secondary">Consumables</div>
          </div>
        </div>

        <div className="card-glass p-4 rounded-card flex items-center gap-3">
          <div className="p-2.5 bg-green-50 rounded-card text-green-600">
            <Building2 size={20} />
          </div>
          <div>
            <div className="text-xl font-bold text-text-primary font-heading">{suppliers.length}</div>
            <div className="text-xs text-text-secondary">Suppliers</div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-2">
        <div className="flex bg-rose-panel rounded-button p-1 gap-1">
          {([
            ['retail', 'Retail Products', Package],
            ['inhouse', 'Inhouse Consumables', Layers],
            ['suppliers', 'Suppliers & POs', Building2],
            ['movements', 'Stock Audit Log', FileText],
          ] as const).map(([tab, label, Icon]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-button text-xs font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon size={15} />{label}
            </button>
          ))}
        </div>

        {/* Filter controls for Retail Tab */}
        {activeTab === 'retail' && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products or SKU…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-input text-xs text-text-primary focus:border-primary outline-none"
              />
            </div>
            <button
              onClick={() => setLowStockOnly(!lowStockOnly)}
              className={`px-3 py-1.5 rounded-input text-xs font-medium border flex items-center gap-1.5 transition-all ${
                lowStockOnly ? 'bg-amber-500 text-white border-amber-500' : 'bg-white border-gray-200 text-text-secondary hover:border-gray-300'
              }`}
            >
              <Filter size={13} /> Low Stock Only
            </button>
          </div>
        )}
      </div>

      {/* ── TAB 1: Retail Products Table ── */}
      {activeTab === 'retail' && (
        <div className="bg-white rounded-card shadow-card border border-primary-100/40 overflow-hidden">
          {prodLoading ? (
            <div className="flex items-center justify-center py-16 text-text-secondary gap-2">
              <RefreshCw size={18} className="animate-spin text-primary" /> Loading products…
            </div>
          ) : products.length === 0 ? (
            <div className="p-16 text-center">
              <Package size={48} className="mx-auto text-primary-200 mb-4" />
              <h3 className="font-heading font-semibold text-lg text-text-primary mb-1">No products found</h3>
              <p className="text-text-secondary text-sm mb-4">Add your retail hair & skin care products to track stock levels.</p>
              <button onClick={() => setShowProductModal(true)} className="btn-primary mx-auto flex items-center gap-2">
                <Plus size={16} /> Add Product
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-rose-panel border-b border-gray-200 text-xs font-bold text-text-secondary uppercase tracking-wider">
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock Qty</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(p => {
                  const isLow = p.stockQty <= p.minStockLevel;
                  const isOut = p.stockQty === 0;

                  return (
                    <tr key={p.id} className="hover:bg-rose-50/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-text-primary">
                        {p.name}
                        {p.description && <div className="text-xs font-normal text-text-secondary truncate max-w-xs">{p.description}</div>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-text-secondary">{p.sku || '—'}</td>
                      <td className="px-4 py-3 font-bold text-text-primary">{formatCurrency(p.price)}</td>
                      <td className="px-4 py-3 font-bold text-text-primary">
                        {p.stockQty} <span className="text-xs font-normal text-text-secondary">{p.unit}s</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold border ${
                          isOut ? 'bg-red-50 text-red-700 border-red-200' :
                          isLow ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-green-50 text-green-700 border-green-200'
                        }`}>
                          {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setAdjustingProduct(p)}
                            className="px-2.5 py-1 bg-rose-50 border border-primary-200 text-primary hover:bg-primary hover:text-white rounded-input text-xs font-semibold transition-all flex items-center gap-1"
                          >
                            <RotateCcw size={12} /> Adjust Stock
                          </button>
                          <button
                            onClick={() => { setEditingProduct(p); setShowProductModal(true); }}
                            className="p-1.5 text-text-secondary hover:text-primary rounded-input hover:bg-rose-50 transition-colors"
                          >
                            <Edit2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── TAB 2: Inhouse Consumables ── */}
      {activeTab === 'inhouse' && (
        <div className="space-y-4">
          <div className="bg-white rounded-card shadow-card border border-primary-100/40 p-5">
            <h3 className="font-heading font-bold text-base text-text-primary mb-1">Inhouse Consumable Transfers (Pool → Station)</h3>
            <p className="text-xs text-text-secondary mb-4">Central store pool stock allocated to individual stylist workstations.</p>

            {inhouseLoading ? (
              <div className="py-12 text-center text-text-secondary"><RefreshCw size={18} className="animate-spin text-primary mx-auto mb-2" /> Loading consumables…</div>
            ) : inhouseItems.length === 0 ? (
              <div className="py-12 text-center text-text-secondary">No inhouse consumable items configured.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inhouseItems.map(item => {
                  const poolQty = item.poolStock[0]?.quantity || 0;

                  return (
                    <div key={item.id} className="p-4 rounded-card border border-gray-200 bg-white shadow-xs space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-text-primary">{item.name}</h4>
                          <span className="text-xs text-text-secondary">Central Pool Stock: <strong className="text-primary">{poolQty} {item.unit}</strong></span>
                        </div>
                        <button
                          onClick={() => setTransferringItem(item)}
                          className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                        >
                          <ArrowRightLeft size={13} /> Transfer to Station
                        </button>
                      </div>

                      {/* Workstation allocations */}
                      <div className="border-t border-gray-100 pt-2 space-y-1">
                        <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Stylist Station Allocations:</span>
                        {item.stationStocks.length === 0 ? (
                          <div className="text-xs text-text-secondary italic">No active station allocations.</div>
                        ) : (
                          item.stationStocks.map(st => (
                            <div key={st.id} className="flex items-center justify-between text-xs py-1 px-2 bg-rose-50/50 rounded-input">
                              <span className="font-medium text-text-primary">{st.employee.name}</span>
                              <span className="font-bold text-primary">{st.quantity} {item.unit}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: Suppliers & Purchase Orders ── */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Supplier Directory */}
          <div className="lg:col-span-1 bg-white rounded-card shadow-card border border-primary-100/40 p-5 space-y-4">
            <h3 className="font-heading font-bold text-base text-text-primary">Suppliers Directory</h3>
            {suppLoading ? (
              <div className="py-8 text-center text-text-secondary"><RefreshCw size={16} className="animate-spin text-primary mx-auto" /></div>
            ) : suppliers.length === 0 ? (
              <div className="text-xs text-text-secondary text-center py-6">No suppliers added yet.</div>
            ) : (
              <div className="space-y-3">
                {suppliers.map(s => (
                  <div key={s.id} className="p-3 rounded-card border border-gray-200 bg-white space-y-1 text-xs">
                    <div className="font-bold text-text-primary text-sm flex items-center gap-1"><Building2 size={14} className="text-primary" />{s.name}</div>
                    {s.phone && <div className="text-text-secondary flex items-center gap-1"><Phone size={12} />{s.phone}</div>}
                    {s.gstin && <div className="text-text-secondary font-mono">GSTIN: {s.gstin}</div>}
                    <div className="text-primary font-semibold pt-1">POs Raised: {s.purchaseOrders?.length || 0}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Purchase Orders List */}
          <div className="lg:col-span-2 bg-white rounded-card shadow-card border border-primary-100/40 p-5 space-y-4">
            <h3 className="font-heading font-bold text-base text-text-primary">Purchase Orders (POs)</h3>
            <div className="text-xs text-text-secondary">Track pending supplier orders and receive stock into inventory.</div>

            <div className="p-4 bg-rose-50 rounded-card border border-primary-200 text-xs text-primary font-medium flex items-center justify-between">
              <span>Receive PO shipments automatically increments retail product stock in 1 click!</span>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: Stock Movement Audit Log ── */}
      {activeTab === 'movements' && (
        <div className="bg-white rounded-card shadow-card border border-primary-100/40 p-5 space-y-4">
          <h3 className="font-heading font-bold text-base text-text-primary">Stock Movement Audit Trail</h3>
          {movLoading ? (
            <div className="py-12 text-center text-text-secondary"><RefreshCw size={18} className="animate-spin text-primary mx-auto" /></div>
          ) : movements.length === 0 ? (
            <div className="text-center py-12 text-text-secondary text-sm">No stock movements recorded yet.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-rose-panel border-b border-gray-200 text-xs font-bold text-text-secondary uppercase">
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Qty Change</th>
                  <th className="px-4 py-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {movements.map(m => (
                  <tr key={m.id} className="hover:bg-rose-50/40">
                    <td className="px-4 py-3 text-text-secondary font-mono">
                      {new Date(m.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 font-semibold text-text-primary">{m.product?.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        m.type === 'PURCHASE' ? 'bg-green-100 text-green-800' :
                        m.type === 'SALE' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {m.type}
                      </span>
                    </td>
                    <td className={`px-4 py-3 font-bold ${m.quantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {m.quantity >= 0 ? `+${m.quantity}` : m.quantity} {m.product?.unit}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{m.reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modals */}
      {showProductModal && (
        <ProductModal
          product={editingProduct}
          onClose={() => { setShowProductModal(false); setEditingProduct(null); }}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setShowProductModal(false);
            setEditingProduct(null);
          }}
        />
      )}

      {adjustingProduct && (
        <StockAdjustModal
          product={adjustingProduct}
          onClose={() => setAdjustingProduct(null)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['movements'] });
            setAdjustingProduct(null);
          }}
        />
      )}

      {transferringItem && (
        <TransferModal
          inhouseItem={transferringItem}
          onClose={() => setTransferringItem(null)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['inhouse-inventory'] });
            setTransferringItem(null);
          }}
        />
      )}
    </div>
  );
}