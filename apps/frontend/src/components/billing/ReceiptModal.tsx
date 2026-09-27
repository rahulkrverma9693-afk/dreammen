import { useRef } from 'react';
import { X, Printer, Scissors, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../utils/cn';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: any;
}

export default function ReceiptModal({ isOpen, onClose, bill }: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !bill) return null;

  const handlePrint = () => {
    const printContent = receiptRef.current?.innerHTML;
    const windowUrl = 'about:blank';
    const uniqueName = new Date().getTime();
    const printWindow = window.open(
      windowUrl,
      `__PRINTER_${uniqueName}`,
      'width=350,height=700'
    );

    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt - ${bill.billNumber}</title>
            <style>
              @page { size: 80mm auto; margin: 0; }
              body {
                font-family: 'Courier New', Courier, monospace;
                width: 78mm;
                margin: 0 auto;
                padding: 4mm 2mm;
                font-size: 11px;
                line-height: 1.3;
                color: #000;
                background: #fff;
              }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .font-bold { font-weight: bold; }
              .divider { border-top: 1px dashed #000; margin: 6px 0; }
              .table { width: 100%; border-collapse: collapse; }
              .table th { border-bottom: 1px solid #000; text-align: left; padding: 2px 0; font-size: 10px; }
              .table td { padding: 3px 0; vertical-align: top; }
              .badge { border: 1px solid #000; padding: 1px 4px; font-size: 9px; display: inline-block; }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-up">
      <div className="bg-white rounded-card shadow-2xl border border-gray-200 max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-green-400" size={20} />
            <div>
              <p className="font-heading font-semibold text-sm">Bill Completed: {bill.billNumber}</p>
              <p className="text-gray-400 text-xs">Ready for 80mm thermal printing</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* 80mm Receipt Scrollable Preview */}
        <div className="p-6 overflow-y-auto bg-gray-100 flex justify-center">
          <div
            ref={receiptRef}
            className="w-[80mm] bg-white p-4 shadow-md font-mono text-[11px] leading-tight border border-gray-200 rounded-sm text-black"
          >
            {/* Header */}
            <div className="text-center space-y-1">
              <div className="flex justify-center mb-1">
                <Scissors size={24} />
              </div>
              <p className="font-bold text-sm tracking-wide">DREAMGIRL FAMILY SALON</p>
              <p className="text-[10px]">Shop 4, Rosewood Galleria, Main Road</p>
              <p className="text-[10px]">Phone: +91 98765 43210 | GSTIN: 27AAAAA0000A1Z5</p>
              <div className="divider" />
            </div>

            {/* Bill Details */}
            <div className="space-y-1 my-2">
              <div className="flex justify-between">
                <span>Bill No: <strong className="font-bold">{bill.billNumber}</strong></span>
                <span>Type: {bill.billType}</span>
              </div>
              <div className="flex justify-between">
                <span>Date: {formatDateTime(bill.createdAt || new Date())}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer: <strong className="font-bold">{bill.customer?.name || 'Walk-in'}</strong></span>
                <span>{bill.customer?.phone || ''}</span>
              </div>
            </div>

            <div className="divider" />

            {/* Items Table */}
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '45%' }}>Item</th>
                  <th style={{ width: '15%' }} className="text-center">Qty</th>
                  <th style={{ width: '20%' }} className="text-right">Price</th>
                  <th style={{ width: '20%' }} className="text-right">Amt</th>
                </tr>
              </thead>
              <tbody>
                {(bill.items || []).map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td>
                      <div>{item.name}</div>
                      {item.employee?.name && (
                        <div style={{ fontSize: '9px', color: '#444' }}>by {item.employee.name}</div>
                      )}
                    </td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="text-right font-bold">{formatCurrency(item.netAmount || (item.quantity * item.unitPrice))}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="divider" />

            {/* Totals */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(bill.grossTotal)}</span>
              </div>
              {Number(bill.discount) > 0 && (
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>-{formatCurrency(bill.discount)}</span>
                </div>
              )}
              {Number(bill.taxAmount) > 0 && (
                <div className="flex justify-between">
                  <span>GST Tax (18%):</span>
                  <span>+{formatCurrency(bill.taxAmount)}</span>
                </div>
              )}
              {Number(bill.tipAmount) > 0 && (
                <div className="flex justify-between">
                  <span>Stylist Tip:</span>
                  <span>+{formatCurrency(bill.tipAmount)}</span>
                </div>
              )}

              <div className="divider" />

              <div className="flex justify-between font-bold text-sm my-1">
                <span>NET PAYABLE:</span>
                <span>{formatCurrency(bill.netPayable)}</span>
              </div>

              {/* Payment Methods */}
              <div className="divider" />
              <div className="space-y-0.5 text-[10px]">
                <p className="font-bold">Payment Details:</p>
                {(bill.payments || []).map((p: any, i: number) => (
                  <div key={i} className="flex justify-between">
                    <span>{p.method} {p.reference ? `(${p.reference})` : ''}</span>
                    <span>{formatCurrency(p.amount)}</span>
                  </div>
                ))}
                {bill.paymentStatus === 'PAID' && (
                  <p className="text-center font-bold mt-1 text-[10px]">[ PAID IN FULL ]</p>
                )}
              </div>
            </div>

            {/* Note & Footer */}
            {bill.billNote && (
              <div className="my-2 p-1 border border-black text-center text-[10px]">
                Note: {bill.billNote}
              </div>
            )}

            <div className="divider" />
            <div className="text-center space-y-1 mt-2">
              <p className="font-bold">Thank you for visiting DreamGirl Salon!</p>
              <p className="text-[9px]">For Appointments Call: +91 98765 43210</p>
              <p className="text-[9px]">Follow us on Instagram @dreamgirlsalon</p>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-white p-4 border-t border-gray-200 flex items-center justify-between">
          <button onClick={onClose} className="btn-secondary text-xs">
            Close Window
          </button>
          <button onClick={handlePrint} className="btn-primary flex items-center gap-2 text-sm">
            <Printer size={18} /> Print Thermal Receipt (80mm)
          </button>
        </div>
      </div>
    </div>
  );
}
