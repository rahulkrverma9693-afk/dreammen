import { useState } from 'react';
import {
  X, Banknote, CreditCard, Smartphone, Wallet, Split,
  CheckCircle2, Printer, AlertCircle, ArrowRight, Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/cn';

interface PaymentMethodItem {
  method: 'CASH' | 'CARD' | 'UPI' | 'WALLET' | 'MEMBERSHIP_CREDITS';
  amount: number;
  reference?: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  billData: {
    customerName?: string;
    customerPhone?: string;
    grossTotal: number;
    discount: number;
    taxAmount: number;
    tipAmount: number;
    netPayable: number;
    items: any[];
    walletBalance?: number;
    isAdvance?: boolean;
  };
  onComplete: (paymentDetails: { payments: PaymentMethodItem[]; isAdvance: boolean; billNote?: string }, triggerReceipt: boolean) => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  billData,
  onComplete,
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'CASH' | 'CARD' | 'UPI' | 'WALLET' | 'SPLIT'>('CASH');
  const [cashTendered, setCashTendered] = useState<number>(billData.netPayable);
  const [cardLast4, setCardLast4] = useState<string>('');
  const [upiRef, setUpiRef] = useState<string>('');
  const [upiVerified, setUpiVerified] = useState<boolean>(false);
  const [isAdvance, setIsAdvance] = useState<boolean>(Boolean(billData.isAdvance));
  const [billNote, setBillNote] = useState<string>('');

  // Split payment state
  const [splitItems, setSplitItems] = useState<{ method: 'CASH' | 'CARD' | 'UPI' | 'WALLET'; amount: number }[]>([
    { method: 'CASH', amount: Math.round(billData.netPayable / 2) },
    { method: 'UPI', amount: Math.round(billData.netPayable / 2) },
  ]);

  if (!isOpen) return null;

  const changeDue = Math.max(0, cashTendered - billData.netPayable);

  const handleSimulateUpi = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: 'Verifying UPI Payment on Razorpay...',
        success: 'UPI Payment Confirmed! ✅',
        error: 'UPI Verification failed',
      }
    ).then(() => {
      setUpiVerified(true);
      setUpiRef(`UPI-${Math.floor(100000000000 + Math.random() * 900000000000)}`);
    });
  };

  const handlePay = (triggerPrint: boolean = false) => {
    let payments: PaymentMethodItem[] = [];

    if (selectedMethod === 'CASH') {
      if (cashTendered < billData.netPayable && !isAdvance) {
        toast.error(`Cash tendered (₹${cashTendered}) is less than net payable (₹${billData.netPayable})`);
        return;
      }
      payments.push({ method: 'CASH', amount: isAdvance ? cashTendered : billData.netPayable });
    } else if (selectedMethod === 'CARD') {
      payments.push({ method: 'CARD', amount: billData.netPayable, reference: cardLast4 ? `Card ending ${cardLast4}` : 'Card Payment' });
    } else if (selectedMethod === 'UPI') {
      payments.push({ method: 'UPI', amount: billData.netPayable, reference: upiRef || 'UPI QR Payment' });
    } else if (selectedMethod === 'WALLET') {
      const avail = billData.walletBalance || 0;
      if (avail < billData.netPayable) {
        toast.error(`Insufficient wallet balance (₹${avail}). Use split payment.`);
        return;
      }
      payments.push({ method: 'WALLET', amount: billData.netPayable, reference: 'Wallet Deduction' });
    } else if (selectedMethod === 'SPLIT') {
      const splitTotal = splitItems.reduce((s, i) => s + (i.amount || 0), 0);
      if (splitTotal !== billData.netPayable && !isAdvance) {
        toast.error(`Split payments sum (₹${splitTotal}) must equal net payable (₹${billData.netPayable})`);
        return;
      }
      payments = splitItems.map(s => ({ method: s.method, amount: s.amount }));
    }

    onComplete({ payments, isAdvance, billNote }, triggerPrint);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-up">
      <div className="bg-white rounded-card shadow-2xl border border-primary-100 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-rose-gradient text-white p-5 flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-xl flex items-center gap-2">
              <Sparkles size={20} className="text-pink-200" /> Payment & Checkout
            </h2>
            <p className="text-pink-100 text-xs mt-0.5">
              Customer: <span className="font-semibold text-white">{billData.customerName || 'Walk-in Customer'}</span> ({billData.customerPhone || 'N/A'})
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Amount Highlight Banner */}
          <div className="bg-rose-panel rounded-card p-4 flex items-center justify-between border border-primary-200">
            <div>
              <p className="text-xs text-text-secondary uppercase font-semibold">Total Payable Amount</p>
              <p className="font-heading font-bold text-3xl text-primary mt-0.5">
                {formatCurrency(billData.netPayable)}
              </p>
            </div>
            <div className="text-right text-xs text-text-secondary space-y-0.5">
              <p>Gross: {formatCurrency(billData.grossTotal)}</p>
              <p className="text-green-700">Discount: -{formatCurrency(billData.discount)}</p>
              <p>GST Tax: +{formatCurrency(billData.taxAmount)}</p>
            </div>
          </div>

          {/* Payment Method Selector Grid */}
          <div>
            <label className="form-label mb-2">Select Payment Method</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { id: 'CASH',   label: 'Cash',   icon: Banknote },
                { id: 'UPI',    label: 'UPI / QR',icon: Smartphone },
                { id: 'CARD',   label: 'Card',   icon: CreditCard },
                { id: 'WALLET', label: 'Wallet', icon: Wallet },
                { id: 'SPLIT',  label: 'Split',  icon: Split },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedMethod(id as any)}
                  className={`p-3 rounded-card border text-center flex flex-col items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                    selectedMethod === id
                      ? 'border-primary bg-primary text-white font-semibold shadow-card'
                      : 'border-gray-200 bg-white text-text-secondary hover:border-primary-300 hover:bg-rose-panel/50'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-xs font-heading">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Payment Method Forms */}
          <div className="bg-gray-50/70 p-4 rounded-card border border-gray-100">
            {/* CASH */}
            {selectedMethod === 'CASH' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Cash Tendered (₹)</label>
                    <input
                      type="number"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(Number(e.target.value))}
                      className="input-field font-semibold text-lg"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="form-label">Change Due to Customer</label>
                    <div className="input-field bg-gray-100 font-bold text-lg text-green-700 flex items-center">
                      {formatCurrency(changeDue)}
                    </div>
                  </div>
                </div>
                {/* Quick denomination buttons */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-secondary">Quick Fill:</span>
                  {[billData.netPayable, 500, 1000, 2000, 5000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCashTendered(val)}
                      className="px-2.5 py-1 bg-white border border-gray-200 rounded-card text-xs hover:border-primary hover:text-primary"
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* UPI */}
            {selectedMethod === 'UPI' && (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Mock QR Code Display */}
                <div className="w-36 h-36 bg-white p-2 border-2 border-primary-200 rounded-card flex flex-col items-center justify-center shadow-card relative">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=upi://pay?pa=dreamgirlsalon@razorpay%26pn=DreamGirl%2520Salon%26am=${billData.netPayable}%26cu=INR`}
                    alt="UPI QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <p className="text-sm font-semibold text-text-primary">Scan QR with Google Pay, PhonePe, Paytm</p>
                  <p className="text-xs text-text-secondary">VPA: <span className="font-mono font-medium">dreamgirlsalon@razorpay</span></p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSimulateUpi}
                      className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={16} /> Auto-Verify Payment
                    </button>
                    {upiVerified && (
                      <span className="badge-success flex items-center gap-1">
                        <CheckCircle2 size={12} /> Verified
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Transaction Ref / UTR (Optional)</label>
                    <input
                      type="text"
                      value={upiRef}
                      onChange={(e) => setUpiRef(e.target.value)}
                      placeholder="e.g. 423456789012"
                      className="input-field text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* CARD */}
            {selectedMethod === 'CARD' && (
              <div className="space-y-3">
                <p className="text-xs text-text-secondary">Swipe/Dip card on POS machine (HDFC/ICICI/Razorpay POS)</p>
                <div>
                  <label className="form-label">Card Last 4 Digits (For reference)</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={cardLast4}
                    onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 4382"
                    className="input-field font-mono text-center tracking-widest text-base w-40"
                  />
                </div>
              </div>
            )}

            {/* WALLET */}
            {selectedMethod === 'WALLET' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white p-3 rounded-card border border-gray-200">
                  <div className="flex items-center gap-2">
                    <Wallet size={20} className="text-primary" />
                    <div>
                      <p className="text-xs text-text-secondary">Customer Wallet Balance</p>
                      <p className="font-bold text-sm text-text-primary">{formatCurrency(billData.walletBalance || 0)}</p>
                    </div>
                  </div>
                  {(billData.walletBalance || 0) >= billData.netPayable ? (
                    <span className="badge-success">Sufficient</span>
                  ) : (
                    <span className="badge-error flex items-center gap-1">
                      <AlertCircle size={12} /> Short by {formatCurrency(billData.netPayable - (billData.walletBalance || 0))}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* SPLIT */}
            {selectedMethod === 'SPLIT' && (
              <div className="space-y-3">
                <p className="text-xs text-text-secondary">Combine multiple payment methods:</p>
                {splitItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={item.method}
                      onChange={(e) => {
                        const newArr = [...splitItems];
                        newArr[idx].method = e.target.value as any;
                        setSplitItems(newArr);
                      }}
                      className="select-field text-xs w-32"
                    >
                      <option value="CASH">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="CARD">Card</option>
                      <option value="WALLET">Wallet</option>
                    </select>
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) => {
                        const newArr = [...splitItems];
                        newArr[idx].amount = Number(e.target.value);
                        setSplitItems(newArr);
                      }}
                      className="input-field text-xs flex-1"
                      placeholder="Amount"
                    />
                    <button
                      type="button"
                      onClick={() => setSplitItems(splitItems.filter((_, i) => i !== idx))}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setSplitItems([...splitItems, { method: 'CASH', amount: 0 }])}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  + Add Split Line
                </button>
              </div>
            )}
          </div>

          {/* Options: Advance payment & receipt note */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-text-secondary">
              <input
                type="checkbox"
                checked={isAdvance}
                onChange={(e) => setIsAdvance(e.target.checked)}
                className="rounded text-primary focus:ring-primary h-4 w-4"
              />
              Mark as Advance Payment (Balance due tracked)
            </label>
          </div>

          <div>
            <label className="form-label">Receipt Note (Printed on bill)</label>
            <input
              type="text"
              value={billNote}
              onChange={(e) => setBillNote(e.target.value)}
              placeholder="e.g. Thank you! Next visit get 10% off"
              className="input-field text-xs"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 p-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <button onClick={onClose} className="btn-ghost text-sm">
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePay(false)}
              className="btn-secondary flex items-center gap-1.5 text-sm py-2.5"
            >
              Complete Bill
            </button>
            <button
              onClick={() => handlePay(true)}
              className="btn-primary flex items-center gap-1.5 text-sm py-2.5"
            >
              <Printer size={16} /> Pay & Print Thermal Receipt <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
