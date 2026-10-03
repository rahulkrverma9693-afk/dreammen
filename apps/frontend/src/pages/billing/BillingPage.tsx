import { useState, useMemo, useEffect } from 'react';
import {
  Scissors, ShoppingBag, Package, Sparkles, CreditCard, Award,
  Plus, Trash2, Search, UserPlus, Clock, RotateCcw, Check,
  Percent, DollarSign, Tag, HelpCircle, FileText, ChevronRight,
  ShieldCheck, ArrowRight, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';

import {
  MOCK_CATEGORIES, MOCK_SERVICES, MOCK_PRODUCTS,
  MOCK_EMPLOYEES, MOCK_CUSTOMERS, MOCK_PACKS,
} from '../../utils/mockData';
import { formatCurrency } from '../../utils/cn';

import PaymentModal from '../../components/billing/PaymentModal';
import ReceiptModal from '../../components/billing/ReceiptModal';
import DraftsDrawer from '../../components/billing/DraftsDrawer';
import CustomerModal from '../../components/customers/CustomerModal';

export interface LineItem {
  id: string;
  itemType: 'SERVICE' | 'PRODUCT' | 'COMBO_PACK' | 'SPA_PACK' | 'PREPAID_PACK' | 'MEMBERSHIP';
  referenceId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  netAmount: number;
  employeeId?: string;
  employeeName?: string;
  referredServiceId?: string;
}

export default function BillingPage() {
  const queryClient = useQueryClient();

  // State — Customer & Basic info
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'FEMALE' | 'MALE'>('ALL');
  const [isSavingBill, setIsSavingBill] = useState(false);

  // State — Billing items & Discounts
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [discountType, setDiscountType] = useState<'FLAT' | 'PERCENT'>('FLAT');
  const [globalDiscountValue, setGlobalDiscountValue] = useState<number>(0);
  const [gstEnabled, setGstEnabled] = useState<boolean>(true);
  const [priceInclusiveTax, setPriceInclusiveTax] = useState<boolean>(false);
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [billNote, setBillNote] = useState<string>('');
  const [privateNote, setPrivateNote] = useState<string>('');
  const [customBillNo, setCustomBillNo] = useState<string>('DG-2026-0048');

  // State — Active Billing Tab
  const [activeTab, setActiveTab] = useState<'SERVICE' | 'PRODUCT' | 'COMBO' | 'SPA' | 'PREPAID' | 'MEMBERSHIP'>('SERVICE');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('cat-1');
  const [serviceSearch, setServiceSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  // Modals & Drawers
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isDraftsDrawerOpen, setIsDraftsDrawerOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [draftsList, setDraftsList] = useState<any[]>([]);
  const [completedBillData, setCompletedBillData] = useState<any>(null);

  // ─── API Data Fetching ─────────────────────────────────────
  // Customers search (live from DB — no mock fallback)
  const { data: apiCustomers = [], error: customersError } = useQuery({
    queryKey: ['billing-customers', customerSearch],
    queryFn: async () => {
      const url = customerSearch.trim()
        ? `/customers?search=${encodeURIComponent(customerSearch)}&limit=15`
        : `/customers?limit=15`;
      const r = await api.get(url);
      const list = r.data.data?.customers || (Array.isArray(r.data.data) ? r.data.data : []);
      return list;
    },
    enabled: showCustomerDropdown && !selectedCustomer,
    retry: 2,
  });

  // Products (live from DB — no mock fallback)
  const { data: products = [], isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ['billing-products', productSearch],
    queryFn: async () => {
      const params = productSearch ? `?search=${encodeURIComponent(productSearch)}` : '';
      const r = await api.get(`/inventory/products${params}`);
      return Array.isArray(r.data.data) ? r.data.data : [];
    },
    enabled: activeTab === 'PRODUCT',
    retry: 2,
  });

  // Services (live from DB — no mock fallback)
  const { data: services = [], isLoading: servicesLoading, error: servicesError } = useQuery({
    queryKey: ['billing-services'],
    queryFn: async () => {
      const r = await api.get('/services');
      return Array.isArray(r.data.data) ? r.data.data : [];
    },
    retry: 2,
  });

  // Categories (live from DB — no mock fallback)
  const { data: categories = [], error: categoriesError } = useQuery({
    queryKey: ['billing-categories'],
    queryFn: async () => {
      const r = await api.get('/services/categories');
      return Array.isArray(r.data.data) ? r.data.data : [];
    },
    retry: 2,
  });

  // Employees (live from DB — no mock fallback)
  const { data: employees = [], error: employeesError } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const r = await api.get('/employees');
      return Array.isArray(r.data.data) ? r.data.data : [];
    },
    retry: 2,
  });

  // Any critical data load error worth surfacing
  const dataLoadError = servicesError || categoriesError || employeesError;

  // Drafts from DB
  useEffect(() => {
    api.get('/bills/drafts').then(r => {
      const dbDrafts = r.data.data || [];
      if (dbDrafts.length > 0) setDraftsList(dbDrafts);
    }).catch(() => {});
  }, []);

  // Spa Pack Sub-tab
  const [spaSubTab, setSpaSubTab] = useState<'ASSIGN' | 'REDEEM'>('ASSIGN');

  // Filtered Customers dropdown (uses live API data only — no mock fallback)
  const filteredCustomers = useMemo(() => {
    return apiCustomers;
  }, [apiCustomers]);

  // Filtered Services by category, gender & search (uses live API data)
  const filteredServices = useMemo(() => {
    return services.filter((s: any) => {
      const matchCat = s.categoryId === selectedCategoryId;
      const matchSearch = s.name.toLowerCase().includes(serviceSearch.toLowerCase());
      const cat = categories.find((c: any) => c.id === s.categoryId);
      const matchGender =
        genderFilter === 'ALL' ||
        !cat?.genderApplicable ||
        cat.genderApplicable === genderFilter;
      return matchCat && matchSearch && matchGender;
    });
  }, [selectedCategoryId, serviceSearch, genderFilter, services, categories]);

  // Invoice calculations
  const grossTotal = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }, [lineItems]);

  const calculatedDiscount = useMemo(() => {
    if (discountType === 'PERCENT') {
      return Math.round((grossTotal * (globalDiscountValue || 0)) / 100);
    }
    return globalDiscountValue || 0;
  }, [grossTotal, discountType, globalDiscountValue]);

  const taxTotal = useMemo(() => {
    if (!gstEnabled) return 0;
    return lineItems.reduce((sum, item) => {
      const itemGross = item.quantity * item.unitPrice;
      const itemDiscount = item.discount ? (itemGross * item.discount) / 100 : 0;
      const taxable = Math.max(0, itemGross - itemDiscount);
      const rate = item.taxRate !== undefined ? item.taxRate : 18;
      return sum + Math.round((taxable * rate) / 100);
    }, 0);
  }, [gstEnabled, lineItems]);

  const netPayable = useMemo(() => {
    const val = Math.max(0, grossTotal - calculatedDiscount + taxTotal + (tipAmount || 0));
    return Math.round(val);
  }, [grossTotal, calculatedDiscount, taxTotal, tipAmount]);

  // Line Item Handlers
  const addServiceToBill = (service: any) => {
    const existing = lineItems.find((i) => i.referenceId === service.id && i.itemType === 'SERVICE');
    if (existing) {
      setLineItems(
        lineItems.map((i) =>
          i.id === existing.id ? { ...i, quantity: i.quantity + 1, netAmount: (i.quantity + 1) * i.unitPrice } : i
        )
      );
    } else {
      const newItem: LineItem = {
        id: `item-${Date.now()}-${Math.random()}`,
        itemType: 'SERVICE',
        referenceId: service.id,
        name: service.name,
        quantity: 1,
        unitPrice: service.price,
        discount: 0,
        taxRate: service.taxRate,
        taxAmount: Math.round(service.price * 0.18),
        netAmount: service.price,
        employeeId: employees[0]?.id || '',
        employeeName: employees[0]?.name || '',
      };
      setLineItems([...lineItems, newItem]);
    }
    toast.success(`Added ${service.name}`);
  };

  const addProductToBill = (product: any) => {
    const newItem: LineItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      itemType: 'PRODUCT',
      referenceId: product.id,
      name: product.name,
      quantity: 1,
      unitPrice: product.price,
      discount: 0,
      taxRate: product.taxRate,
      taxAmount: Math.round(product.price * 0.18),
      netAmount: product.price,
    };
    setLineItems([...lineItems, newItem]);
    toast.success(`Added retail product ${product.name}`);
  };

  const addPackToBill = (pack: any, itemType: any) => {
    const newItem: LineItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      itemType,
      referenceId: pack.id,
      name: pack.name,
      quantity: 1,
      unitPrice: pack.price,
      discount: 0,
      taxRate: 18,
      taxAmount: Math.round(pack.price * 0.18),
      netAmount: pack.price,
    };
    setLineItems([...lineItems, newItem]);
    toast.success(`Added ${pack.name} to bill`);
  };

  const updateLineItem = (id: string, updates: Partial<LineItem>) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id === id) {
          const qty = updates.quantity !== undefined ? updates.quantity : item.quantity;
          const price = updates.unitPrice !== undefined ? updates.unitPrice : item.unitPrice;
          const net = qty * price;
          return { ...item, ...updates, netAmount: net };
        }
        return item;
      })
    );
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter((i) => i.id !== id));
  };

  const handleReset = () => {
    setLineItems([]);
    setSelectedCustomer(null);
    setCustomerSearch('');
    setGlobalDiscountValue(0);
    setTipAmount(0);
    setBillNote('');
    setPrivateNote('');
    toast.success('Billing form cleared');
  };

  const handleSaveDraft = async () => {
    if (lineItems.length === 0) {
      toast.error('Add at least one item to save draft');
      return;
    }
    try {
      const response = await api.post('/bills', {
        customerId: selectedCustomer?.id || null,
        billType: activeTab,
        grossTotal,
        discount: calculatedDiscount,
        discountType,
        taxAmount: taxTotal,
        tipAmount,
        netPayable,
        isDraft: true,
        billNote,
        privateNote,
        items: lineItems.map(item => ({
          itemType: item.itemType,
          referenceId: item.referenceId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount,
          netAmount: item.netAmount,
          employeeId: item.employeeId || null,
        })),
        payments: [],
      });
      const savedDraft = response.data.data;
      setDraftsList([savedDraft, ...draftsList]);
      toast.success(`Bill ${savedDraft.billNumber || customBillNo} saved as draft! 📋`);
      handleReset();
    } catch {
      // Fallback to local draft if API fails
      const draft = {
        id: `draft-${Date.now()}`,
        billNumber: customBillNo,
        customer: selectedCustomer,
        items: lineItems,
        grossTotal,
        discount: calculatedDiscount,
        taxAmount: taxTotal,
        netPayable,
        createdAt: new Date().toISOString(),
      };
      setDraftsList([draft, ...draftsList]);
      toast.success(`Bill ${customBillNo} saved as draft (offline)! 📋`);
      handleReset();
    }
  };

  const handleCompletePayment = async (paymentDetails: any, triggerPrint: boolean) => {
    if (isSavingBill) return;
    setIsSavingBill(true);
    try {
      const response = await api.post('/bills', {
        customerId: selectedCustomer?.id || null,
        billType: activeTab,
        grossTotal,
        discount: calculatedDiscount,
        discountType,
        taxAmount: taxTotal,
        tipAmount,
        netPayable,
        isDraft: false,
        billNote: paymentDetails.billNote || billNote,
        privateNote,
        items: lineItems.map(item => ({
          itemType: item.itemType,
          referenceId: item.referenceId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount,
          netAmount: item.netAmount,
          serviceId: item.itemType === 'SERVICE' ? item.referenceId : null,
          productId: item.itemType === 'PRODUCT' ? item.referenceId : null,
          employeeId: item.employeeId || null,
        })),
        payments: paymentDetails.payments,
      });

      const savedBill = response.data.data;
      const completedBill = {
        ...savedBill,
        billNumber: savedBill.billNumber || customBillNo,
        billType: activeTab,
        customer: selectedCustomer,
        items: lineItems,
        grossTotal,
        discount: calculatedDiscount,
        taxAmount: taxTotal,
        tipAmount,
        netPayable,
        payments: paymentDetails.payments,
        paymentStatus: 'PAID',
        billNote: paymentDetails.billNote || billNote,
        createdAt: new Date().toISOString(),
      };

      setCompletedBillData(completedBill);
      setIsPaymentModalOpen(false);

      // Auto increment bill number from DB response
      if (savedBill.billNumber) {
        const nextNo = parseInt(savedBill.billNumber.replace(/\D/g, '')) + 1;
        setCustomBillNo(`DG-2026-${String(nextNo).padStart(4, '0')}`);
      }

      handleReset();

      // Invalidate reports and dashboard caches
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['billing-products'] }); // stock changed

      if (triggerPrint) {
        setIsReceiptModalOpen(true);
      } else {
        toast.success(`Bill ${completedBill.billNumber} completed successfully! 🎉`);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to save bill — please try again';
      toast.error(msg);
    } finally {
      setIsSavingBill(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Top Header Controls Bar */}
      <div className="card-glass p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-gradient flex items-center justify-center shadow-card text-white">
            <Scissors size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading font-bold text-xl text-text-primary">Billing Terminal</h1>
              <span className="badge-rose text-xs font-mono font-bold">{customBillNo}</span>
            </div>
            <p className="text-xs text-text-secondary">Create & process service, product & package bills</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={() => setIsDraftsDrawerOpen(true)}
            className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
          >
            <Clock size={16} /> Drafts ({draftsList.length})
          </button>
          <button
            onClick={handleReset}
            className="p-2 rounded-button hover:bg-gray-100 text-text-secondary hover:text-red-500 transition-colors"
            title="Reset Form"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={handleSaveDraft}
            className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
          >
            Save Draft
          </button>
        </div>
      </div>

      {/* Main Two-Panel Billing Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT PANEL — Customer & Invoice Config (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Customer Selection Card */}
          <div className="card-glass p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="section-header text-sm flex items-center gap-1.5">
                <Scissors size={16} className="text-primary" /> Customer Info
              </h3>
              <button
                onClick={() => setIsCustomerModalOpen(true)}
                className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
              >
                <UserPlus size={14} /> + New Customer
              </button>
            </div>

            {/* Customer Search Autocomplete */}
            <div className="relative">
              <div className="relative">
                <input
                  type="text"
                  value={selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.phone})` : customerSearch}
                  onChange={(e) => {
                    setSelectedCustomer(null);
                    setCustomerSearch(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  placeholder="Search customer by name or phone..."
                  className="input-field pr-8 text-sm"
                />
                <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>

              {/* Autocomplete Dropdown */}
              {showCustomerDropdown && filteredCustomers.length > 0 && !selectedCustomer && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-primary-100 rounded-card shadow-lg z-30 max-h-48 overflow-y-auto">
                  {filteredCustomers.map((c: any) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(c);
                        setShowCustomerDropdown(false);
                        if (c.gender) setGenderFilter(c.gender as any);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-rose-panel/50 border-b border-gray-50 flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-text-primary">{c.name}</p>
                        <p className="text-[10px] text-text-secondary">{c.phone} | {c.customerId}</p>
                      </div>
                      <div className="text-right">
                        <span className="badge-rose text-[9px]">{c.group?.name || 'Customer'}</span>
                        <p className="text-[10px] text-primary font-medium mt-0.5">Wallet: {formatCurrency(c.walletBalance)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Customer Preview Card */}
            {selectedCustomer ? (
              <div className="bg-rose-panel/60 p-3 rounded-card border border-primary-200 flex items-center justify-between animate-fade-up">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-heading font-semibold text-sm text-text-primary">{selectedCustomer.name}</p>
                    {selectedCustomer.group && (
                      <span className="badge-rose text-[10px]">{selectedCustomer.group.name}</span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary">{selectedCustomer.phone} • Wallet: <strong className="text-primary font-bold">{formatCurrency(selectedCustomer.walletBalance)}</strong></p>
                </div>
                <button
                  onClick={() => {
                    setSelectedCustomer(null);
                    setCustomerSearch('');
                  }}
                  className="text-xs text-red-500 hover:underline font-medium"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="text-xs text-text-secondary bg-gray-50 p-2.5 rounded-card border border-dashed border-gray-200">
                💡 Walk-in customer selected (No wallet / loyalty attached).
              </div>
            )}

            {/* Gender Filter Toggle */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-text-secondary font-medium">Filter Services by Gender:</span>
              <div className="flex bg-gray-100 p-0.5 rounded-card text-xs">
                {(['ALL', 'FEMALE', 'MALE'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGenderFilter(g)}
                    className={`px-2.5 py-1 rounded-card transition-all font-medium ${
                      genderFilter === g ? 'bg-primary text-white shadow-xs' : 'text-text-secondary hover:text-primary'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Line Items List */}
          <div className="card-glass p-4 space-y-3">
            <h3 className="section-header text-sm flex items-center justify-between">
              <span>Bill Items ({lineItems.length})</span>
              <span className="text-xs font-normal text-text-secondary">Subtotal: {formatCurrency(grossTotal)}</span>
            </h3>

            {lineItems.length === 0 ? (
              <div className="py-8 text-center text-text-secondary text-xs border-2 border-dashed border-gray-100 rounded-card">
                <Scissors size={28} className="mx-auto mb-2 opacity-30 text-primary" />
                Select services, products or packages from the right panel to add to bill.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {lineItems.map((item) => (
                  <div key={item.id} className="p-3 bg-gray-50 rounded-card border border-gray-100 flex flex-col gap-2 text-xs">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-text-primary">{item.name}</p>
                        <span className="text-[10px] text-text-secondary uppercase tracking-wider">{item.itemType}</span>
                      </div>
                      <p className="font-heading font-bold text-sm text-primary">{formatCurrency(item.netAmount)}</p>
                    </div>

                    {/* Controls line: Qty, Employee, Delete */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-200/60">
                      {/* Stylist Selector for Services */}
                      {item.itemType === 'SERVICE' && (
                        <select
                          value={item.employeeId}
                          onChange={(e) => updateLineItem(item.id, { employeeId: e.target.value })}
                          className="select-field text-[11px] py-1 px-2 w-36"
                        >
                          {employees.map((e: any) => (
                            <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                          ))}
                        </select>
                      )}

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1 border rounded-card bg-white px-2 py-0.5">
                        <button
                          type="button"
                          onClick={() => updateLineItem(item.id, { quantity: Math.max(1, item.quantity - 1) })}
                          className="text-text-secondary hover:text-primary font-bold px-1"
                        >
                          -
                        </button>
                        <span className="font-semibold px-1">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateLineItem(item.id, { quantity: item.quantity + 1 })}
                          className="text-text-secondary hover:text-primary font-bold px-1"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeLineItem(item.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Discounts, Taxes & Tips Card */}
          <div className="card-glass p-4 space-y-3">
            <h3 className="section-header text-sm">Discounts & Adjustment</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Discount Type</label>
                <div className="flex bg-gray-100 p-0.5 rounded-card text-xs">
                  <button
                    type="button"
                    onClick={() => setDiscountType('FLAT')}
                    className={`flex-1 py-1 rounded-card font-medium ${discountType === 'FLAT' ? 'bg-primary text-white' : 'text-text-secondary'}`}
                  >
                    Flat ₹
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('PERCENT')}
                    className={`flex-1 py-1 rounded-card font-medium ${discountType === 'PERCENT' ? 'bg-primary text-white' : 'text-text-secondary'}`}
                  >
                    Percentage %
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label">Discount Value</label>
                <input
                  type="number"
                  value={globalDiscountValue || ''}
                  onChange={(e) => setGlobalDiscountValue(Number(e.target.value))}
                  placeholder={discountType === 'FLAT' ? 'Amount ₹' : '% Value'}
                  className="input-field text-xs"
                  min={0}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="form-label">Stylist Tip (₹)</label>
                <input
                  type="number"
                  value={tipAmount || ''}
                  onChange={(e) => setTipAmount(Number(e.target.value))}
                  placeholder="Tip amount ₹"
                  className="input-field text-xs"
                  min={0}
                />
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-text-secondary font-medium mb-2">
                  <input
                    type="checkbox"
                    checked={gstEnabled}
                    onChange={(e) => setGstEnabled(e.target.checked)}
                    className="rounded text-primary focus:ring-primary h-4 w-4"
                  />
                  Apply GST (18%)
                </label>
              </div>
            </div>
          </div>

          {/* Invoice Net Summary Footer Box */}
          <div className="bg-rose-gradient text-white p-5 rounded-card shadow-card space-y-3">
            <div className="flex items-center justify-between text-xs text-pink-100">
              <span>Gross Subtotal</span>
              <span>{formatCurrency(grossTotal)}</span>
            </div>
            {calculatedDiscount > 0 && (
              <div className="flex items-center justify-between text-xs text-pink-200">
                <span>Total Discount</span>
                <span>-{formatCurrency(calculatedDiscount)}</span>
              </div>
            )}
            {taxTotal > 0 && (
              <div className="flex items-center justify-between text-xs text-pink-100">
                <span>GST Tax (18%)</span>
                <span>+{formatCurrency(taxTotal)}</span>
              </div>
            )}
            {tipAmount > 0 && (
              <div className="flex items-center justify-between text-xs text-pink-200">
                <span>Stylist Tip</span>
                <span>+{formatCurrency(tipAmount)}</span>
              </div>
            )}
            <div className="border-t border-white/20 pt-2 flex items-center justify-between">
              <div>
                <p className="text-xs text-pink-100 uppercase tracking-wide">Net Amount Payable</p>
                <p className="font-heading font-bold text-3xl text-white">{formatCurrency(netPayable)}</p>
              </div>
              <button
                onClick={() => {
                  if (lineItems.length === 0) {
                    toast.error('Add at least one item to proceed to payment');
                    return;
                  }
                  setIsPaymentModalOpen(true);
                }}
                className="bg-white text-primary font-heading font-bold px-6 py-3 rounded-button shadow-lg hover:bg-pink-50 transition-all flex items-center gap-2"
              >
                {isSavingBill ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw size={16} className="animate-spin" /> Saving Bill...
                  </span>
                ) : (
                  <>Proceed to Pay <ArrowRight size={18} /></>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — Billing Types Selection Tabs (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Navigation Tabs for 6 Billing Types */}
          <div className="card-glass p-2 flex items-center justify-between overflow-x-auto gap-1 border border-primary-100">
            {[
              { id: 'SERVICE',    label: 'Service',   icon: Scissors },
              { id: 'PRODUCT',    label: 'Product',   icon: ShoppingBag },
              { id: 'COMBO',      label: 'Combo Pack',icon: Package },
              { id: 'SPA',        label: 'Spa Pack',  icon: Sparkles },
              { id: 'PREPAID',    label: 'Prepaid',   icon: CreditCard },
              { id: 'MEMBERSHIP', label: 'Membership',icon: Award },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id as any)}
                className={`flex-1 min-w-[90px] py-2 px-3 rounded-card text-xs font-heading font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  activeTab === id
                    ? 'bg-rose-gradient text-white shadow-card'
                    : 'text-text-secondary hover:bg-rose-panel hover:text-primary'
                }`}
              >
                <Icon size={14} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* TAB 1: SERVICE BILLING */}
          {activeTab === 'SERVICE' && (
            <div className="card-glass p-4 space-y-4">
              {/* Category Pills & Search */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                  {categories.map((cat: any) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`px-3 py-1.5 rounded-button text-xs font-medium whitespace-nowrap transition-all ${
                        selectedCategoryId === cat.id
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-gray-100 text-text-secondary hover:bg-rose-panel'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-48">
                  <input
                    type="text"
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    placeholder="Search service..."
                    className="input-field text-xs pr-7"
                  />
                  <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Service Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-1">
                {filteredServices.map((srv: any) => (
                  <div
                    key={srv.id}
                    onClick={() => addServiceToBill(srv)}
                    className="p-3 bg-white hover:bg-rose-panel/40 border border-gray-200 hover:border-primary-300 rounded-card transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2 shadow-xs hover:shadow-card"
                  >
                    <div>
                      <h4 className="font-heading font-semibold text-sm text-text-primary">{srv.name}</h4>
                      <p className="text-[11px] text-text-secondary mt-0.5">Duration: {srv.duration} mins</p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="font-heading font-bold text-sm text-primary">{formatCurrency(srv.price)}</span>
                      <button className="p-1 rounded-full bg-primary text-white hover:bg-primary-800 transition-colors">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCT BILLING */}
          {activeTab === 'PRODUCT' && (
            <div className="card-glass p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="section-header text-sm">Retail Product Catalogue</h3>
                <div className="relative w-60">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search product or SKU..."
                    className="input-field text-xs pr-7"
                  />
                  <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto">
                {products.filter((p: any) => p.name.toLowerCase().includes(productSearch.toLowerCase())).map((prod: any) => (
                  <div
                    key={prod.id}
                    onClick={() => addProductToBill(prod)}
                    className="p-3 bg-white hover:bg-rose-panel/40 border border-gray-200 hover:border-primary-300 rounded-card transition-all cursor-pointer flex flex-col justify-between gap-2 shadow-xs"
                  >
                    <div>
                      <div className="flex justify-between">
                        <span className="text-[10px] font-mono text-gray-400">{prod.sku}</span>
                        <span className="badge-rose text-[9px]">Stock: {prod.stockQty}</span>
                      </div>
                      <h4 className="font-heading font-semibold text-sm text-text-primary mt-1">{prod.name}</h4>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="font-heading font-bold text-sm text-primary">{formatCurrency(prod.price)}</span>
                      <button className="btn-primary text-xs py-1 px-2.5 flex items-center gap-1">
                        <Plus size={12} /> Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: COMBO PACK BILLING */}
          {activeTab === 'COMBO' && (
            <div className="card-glass p-4 space-y-4">
              <h3 className="section-header text-sm">Bundled Combo Packages</h3>
              <div className="space-y-3">
                {MOCK_PACKS.comboPacks.map((pack) => (
                  <div key={pack.id} className="p-4 bg-white border border-gray-200 rounded-card flex items-center justify-between shadow-xs">
                    <div>
                      <h4 className="font-heading font-bold text-sm text-text-primary">{pack.name}</h4>
                      <p className="text-xs text-text-secondary mt-0.5">{pack.description}</p>
                      <span className="badge-gray text-[10px] mt-1">Validity: {pack.validityDays} days</span>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="font-heading font-bold text-lg text-primary">{formatCurrency(pack.price)}</p>
                      <button
                        onClick={() => addPackToBill(pack, 'COMBO_PACK')}
                        className="btn-primary text-xs py-1.5 px-3"
                      >
                        Add to Bill
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SPA PACK BILLING (Assign & Redeem Sub-tabs) */}
          {activeTab === 'SPA' && (
            <div className="card-glass p-4 space-y-4">
              {/* Assign / Redeem Toggle */}
              <div className="flex bg-gray-100 p-1 rounded-card text-xs font-heading font-semibold">
                <button
                  onClick={() => setSpaSubTab('ASSIGN')}
                  className={`flex-1 py-1.5 rounded-card transition-all ${spaSubTab === 'ASSIGN' ? 'bg-primary text-white shadow-xs' : 'text-text-secondary'}`}
                >
                  Assign Spa Pack (Sell New)
                </button>
                <button
                  onClick={() => setSpaSubTab('REDEEM')}
                  className={`flex-1 py-1.5 rounded-card transition-all ${spaSubTab === 'REDEEM' ? 'bg-primary text-white shadow-xs' : 'text-text-secondary'}`}
                >
                  Redeem Spa Session
                </button>
              </div>

              {spaSubTab === 'ASSIGN' ? (
                <div className="space-y-3">
                  {MOCK_PACKS.spaPacks.map((pack) => (
                    <div key={pack.id} className="p-4 bg-white border border-gray-200 rounded-card flex items-center justify-between">
                      <div>
                        <h4 className="font-heading font-bold text-sm text-text-primary">{pack.name}</h4>
                        <p className="text-xs text-text-secondary">{pack.description}</p>
                        <span className="badge-rose text-[10px] mt-1">{pack.sessions} Sessions Included</span>
                      </div>
                      <div className="text-right space-y-2">
                        <p className="font-heading font-bold text-lg text-primary">{formatCurrency(pack.price)}</p>
                        <button
                          onClick={() => addPackToBill(pack, 'SPA_PACK')}
                          className="btn-primary text-xs py-1.5 px-3"
                        >
                          Assign & Bill
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-text-secondary bg-gray-50 rounded-card border border-dashed border-gray-200">
                  <Sparkles size={32} className="mx-auto mb-2 text-primary opacity-40" />
                  {selectedCustomer ? (
                    <div>
                      <p className="font-semibold text-text-primary mb-1">Active Spa Packs for {selectedCustomer.name}</p>
                      <p className="text-green-700">Aroma Massage 5-Session Pass (3 sessions remaining)</p>
                      <button
                        onClick={() => {
                          addServiceToBill({ id: 'spa-redeem-1', name: '[Spa Redeem] Aroma Massage (Session 4/5)', price: 0, duration: 60, taxRate: 0 });
                        }}
                        className="btn-secondary text-xs mt-3 py-1.5 px-3"
                      >
                        Redeem 1 Session (₹0 Charge)
                      </button>
                    </div>
                  ) : (
                    <p>Select a customer on the left panel to view & redeem their active spa sessions.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PREPAID PACK BILLING */}
          {activeTab === 'PREPAID' && (
            <div className="card-glass p-4 space-y-4">
              <h3 className="section-header text-sm">Prepaid Credit Cards (With Bonus)</h3>
              <div className="space-y-3">
                {MOCK_PACKS.prepaidPacks.map((pack) => (
                  <div key={pack.id} className="p-4 bg-white border border-gray-200 rounded-card flex items-center justify-between">
                    <div>
                      <h4 className="font-heading font-bold text-sm text-text-primary">{pack.name}</h4>
                      <p className="text-xs text-green-700 font-semibold mt-0.5">Includes ₹{pack.bonusAmount} Extra Bonus!</p>
                      <p className="text-[10px] text-text-secondary">Validity: {pack.validityDays} days</p>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="font-heading font-bold text-lg text-primary">{formatCurrency(pack.price)}</p>
                      <button
                        onClick={() => addPackToBill(pack, 'PREPAID_PACK')}
                        className="btn-primary text-xs py-1.5 px-3"
                      >
                        Sell Card
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: MEMBERSHIP BILLING */}
          {activeTab === 'MEMBERSHIP' && (
            <div className="card-glass p-4 space-y-4">
              <h3 className="section-header text-sm">Annual Salon Memberships</h3>
              <div className="space-y-3">
                {MOCK_PACKS.membershipPlans.map((plan) => (
                  <div key={plan.id} className="p-4 bg-rose-panel/50 border border-primary-200 rounded-card flex items-center justify-between">
                    <div>
                      <span className="badge-rose text-[10px] font-bold">12 MONTHS VALIDITY</span>
                      <h4 className="font-heading font-bold text-base text-text-primary mt-1">{plan.name}</h4>
                      <p className="text-xs text-text-secondary mt-0.5">{plan.description}</p>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="font-heading font-bold text-xl text-primary">{formatCurrency(plan.price)}</p>
                      <button
                        onClick={() => addPackToBill(plan, 'MEMBERSHIP')}
                        className="btn-primary text-xs py-2 px-4 shadow-card"
                      >
                        Sell Membership
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Render Sub Modals */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        billData={{
          customerName: selectedCustomer?.name,
          customerPhone: selectedCustomer?.phone,
          grossTotal,
          discount: calculatedDiscount,
          taxAmount: taxTotal,
          tipAmount,
          netPayable,
          items: lineItems,
          walletBalance: selectedCustomer?.walletBalance || 0,
        }}
        onComplete={handleCompletePayment}
      />

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        bill={completedBillData}
      />

      <DraftsDrawer
        isOpen={isDraftsDrawerOpen}
        onClose={() => setIsDraftsDrawerOpen(false)}
        drafts={draftsList}
        onResume={(draft) => {
          setCustomBillNo(draft.billNumber);
          setSelectedCustomer(draft.customer);
          setLineItems(draft.items);
          setIsDraftsDrawerOpen(false);
          toast.success(`Resumed draft ${draft.billNumber}`);
        }}
        onDelete={(id) => setDraftsList(draftsList.filter((d) => d.id !== id))}
      />

      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSuccess={(cust) => {
          // cust is now a real DB record from api.post('/customers')
          setSelectedCustomer(cust);
          queryClient.invalidateQueries({ queryKey: ['billing-customers'] });
          queryClient.invalidateQueries({ queryKey: ['customers'] });
        }}
      />
    </div>
  );
}