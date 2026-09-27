import { X, Play, Trash2, Clock } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../utils/cn';

interface DraftsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  drafts: any[];
  onResume: (draft: any) => void;
  onDelete: (id: string) => void;
}

export default function DraftsDrawer({
  isOpen,
  onClose,
  drafts,
  onResume,
  onDelete,
}: DraftsDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-slide-in">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-rose-panel">
          <div>
            <h3 className="font-heading font-bold text-lg text-primary flex items-center gap-2">
              <Clock size={18} /> Saved Draft Bills ({drafts.length})
            </h3>
            <p className="text-xs text-text-secondary">Resume or discard pending customer bills</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white text-text-secondary">
            <X size={20} />
          </button>
        </div>

        {/* Draft List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {drafts.length === 0 ? (
            <div className="text-center py-12 text-text-secondary text-sm">
              <Clock size={36} className="mx-auto mb-2 opacity-30" />
              No saved draft bills found.
            </div>
          ) : (
            drafts.map((draft) => (
              <div
                key={draft.id}
                className="card-glass p-4 border border-primary-100 hover:border-primary-300 transition-all flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="badge-rose text-[10px] font-bold">{draft.billNumber}</span>
                    <h4 className="font-heading font-semibold text-sm text-text-primary mt-1">
                      {draft.customer?.name || 'Walk-in Customer'}
                    </h4>
                    <p className="text-xs text-text-secondary">{draft.customer?.phone || 'No Phone'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-heading font-bold text-base text-primary">
                      {formatCurrency(draft.netPayable)}
                    </p>
                    <p className="text-[10px] text-text-secondary">
                      {formatDateTime(draft.createdAt || new Date())}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-text-secondary border-t border-gray-100 pt-2 flex items-center justify-between">
                  <span>{draft.items?.length || 0} line item(s)</span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onDelete(draft.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors"
                      title="Delete Draft"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={() => onResume(draft)}
                      className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                    >
                      <Play size={12} /> Resume Bill
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
