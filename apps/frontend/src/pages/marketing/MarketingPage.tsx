import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Megaphone, Send, Users, Sparkles, Plus, Search, Filter, RefreshCw,
  Gift, Award, Calendar, Check, X, Tag, FileText, Image as ImageIcon,
  MessageSquare, Percent, ArrowRight, ShieldCheck, Flame, Heart, Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

// ─── Types ────────────────────────────────────────────────────
interface Campaign {
  id: string;
  name: string;
  message: string;
  imageUrl?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'SENT';
  sentAt?: string;
  targetGroup?: { id: string; name: string; color?: string };
  targetGender?: string;
  targetBirthdays: boolean;
  targetAnniversaries: boolean;
  metrics: { total: number; sent: number; delivered: number; read: number };
}

interface CustomerGroup {
  id: string;
  name: string;
  description?: string;
  color?: string;
  customers: Array<{ id: string; name: string; phone: string }>;
}

interface UpsellRule {
  id: string;
  triggerService: { id: string; name: string; price: number };
  suggestService: { id: string; name: string; price: number };
  priority: number;
  acceptanceCount: number;
  totalShownCount: number;
}

// Preset WhatsApp Templates
const CAMPAIGN_TEMPLATES = [
  {
    name: '🎂 Birthday Special 20% Off',
    message: 'Happy Birthday {{name}}! 🎁 Celebrate your special day at DreamGirl Salon with a flat 20% OFF on all luxury facials & hair spa. Use code BDAY20. Valid till {{expiry}}.',
    birthdays: true,
  },
  {
    name: '💔 We Miss You (Lapsed 30+ Days)',
    message: 'Hi {{name}}, we miss seeing you at DreamGirl Salon! 🌹 Book your next appointment this week & enjoy a complimentary Hair Spa treatment with any service. Reply BOOK to claim!',
  },
  {
    name: '👑 VIP Exclusive Festival Treat',
    message: 'Exclusive for our VIP Member {{name}}! 💖 Enjoy 25% OFF on our Keratin Treatment & Luxury Pedicure combo this weekend. Limited slots available.',
  },
];

// ─── New Campaign Modal ───────────────────────────────────────
function CampaignModal({
  onClose, onSaved,
}: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [targetGroupId, setTargetGroupId] = useState('');
  const [targetGender, setTargetGender] = useState('');
  const [targetBirthdays, setTargetBirthdays] = useState(false);
  const [targetAnniversaries, setTargetAnniversaries] = useState(false);

  const { data: groups = [] } = useQuery<CustomerGroup[]>({
    queryKey: ['marketing-groups'],
    queryFn: async () => {
      const r = await api.get('/marketing/groups');
      return r.data.data;
    },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/marketing/campaigns', data),
    onSuccess: (_, variables) => {
      toast.success(variables.sendNow ? 'Campaign dispatched on WhatsApp! 🚀' : 'Campaign draft saved');
      onSaved();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to save campaign'),
  });

  function handleApplyTemplate(tmpl: typeof CAMPAIGN_TEMPLATES[0]) {
    setName(tmpl.name);
    setMessage(tmpl.message);
    if (tmpl.birthdays) setTargetBirthdays(true);
  }

  function handleSubmit(sendNow: boolean) {
    if (!name || !message) { toast.error('Name and message are required'); return; }
    mutation.mutate({
      name, message, imageUrl, targetGroupId, targetGender,
      targetBirthdays, targetAnniversaries, sendNow,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-up">
      <div className="bg-white rounded-card shadow-2xl border border-primary-100 max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-rose-gradient text-white p-4 flex items-center justify-between">
          <h3 className="font-heading font-bold text-lg text-white flex items-center gap-2">
            <Megaphone size={20} /> Create WhatsApp Campaign
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 text-white"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-white">
          {/* Preset Templates */}
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1.5 uppercase tracking-wide">Quick Preset Templates</label>
            <div className="flex flex-wrap gap-2">
              {CAMPAIGN_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="px-2.5 py-1 bg-rose-50 border border-primary-200 text-primary hover:bg-primary hover:text-white rounded-input text-xs font-semibold transition-all"
                >
                  {tmpl.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide">Campaign Name *</label>
            <input required type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. August Women's Special Offer" className="input-field" />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide flex items-center justify-between">
              <span>WhatsApp Message Text *</span>
              <span className="text-text-secondary font-normal lowercase">vars: &#123;&#123;name&#125;&#125;, &#123;&#123;offer&#125;&#125;, &#123;&#123;expiry&#125;&#125;</span>
            </label>
            <textarea required value={message} onChange={e => setMessage(e.target.value)}
              rows={4} placeholder="Type your WhatsApp message copy here…" className="input-field resize-none" />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary mb-1 uppercase tracking-wide">Header Banner Image URL (Optional)</label>
            <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..." className="input-field" />
          </div>

          {/* Audience Targeting */}
          <div className="p-4 bg-rose-50 rounded-card border border-primary-100 space-y-3">
            <h4 className="font-bold text-xs text-primary uppercase tracking-wide flex items-center gap-1">
              <Users size={14} /> Audience Targeting Rules
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">Target Customer Group</label>
                <select value={targetGroupId} onChange={e => setTargetGroupId(e.target.value)} className="input-field text-xs">
                  <option value="">All Active Customers</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name} ({g.customers?.length || 0} clients)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1">Gender</label>
                <select value={targetGender} onChange={e => setTargetGender(e.target.value)} className="input-field text-xs">
                  <option value="">All Genders</option>
                  <option value="FEMALE">Female Only</option>
                  <option value="MALE">Male Only</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-1.5 text-xs text-text-primary font-medium cursor-pointer">
                <input type="checkbox" checked={targetBirthdays} onChange={e => setTargetBirthdays(e.target.checked)} className="rounded text-primary focus:ring-primary" />
                Birthdays this month
              </label>
              <label className="flex items-center gap-1.5 text-xs text-text-primary font-medium cursor-pointer">
                <input type="checkbox" checked={targetAnniversaries} onChange={e => setTargetAnniversaries(e.target.checked)} className="rounded text-primary focus:ring-primary" />
                Anniversaries this month
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <button type="button" onClick={() => handleSubmit(false)} disabled={mutation.isPending}
              className="flex-1 py-2.5 rounded-button border border-gray-300 text-sm font-semibold text-text-secondary hover:bg-gray-50">
              Save Draft
            </button>
            <button type="button" onClick={() => handleSubmit(true)} disabled={mutation.isPending}
              className="flex-1 btn-primary flex items-center justify-center gap-2">
              {mutation.isPending ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />} Dispatch Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Marketing Page ──────────────────────────────────────
export default function MarketingPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'campaigns' | 'groups' | 'upsell' | 'loyalty'>('campaigns');
  const [showCampaignModal, setShowCampaignModal] = useState(false);

  // Queries
  const { data: campaigns = [], isLoading: campLoading } = useQuery<Campaign[]>({
    queryKey: ['marketing-campaigns'],
    queryFn: async () => {
      const r = await api.get('/marketing/campaigns');
      return r.data.data;
    },
  });

  const { data: groups = [], isLoading: grpLoading } = useQuery<CustomerGroup[]>({
    queryKey: ['marketing-groups'],
    queryFn: async () => {
      const r = await api.get('/marketing/groups');
      return r.data.data;
    },
  });

  const { data: upsellRules = [], isLoading: upsellLoading } = useQuery<UpsellRule[]>({
    queryKey: ['upsell-rules'],
    queryFn: async () => {
      const r = await api.get('/marketing/upsell-rules');
      return r.data.data;
    },
    enabled: activeTab === 'upsell',
  });

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-text-primary">Marketing & Customer Engagement</h1>
          <p className="text-text-secondary text-sm mt-0.5">
            Automated WhatsApp campaigns, smart upsell engine (SUHA), audience segments, & cashback rewards
          </p>
        </div>
        {activeTab === 'campaigns' && (
          <button
            onClick={() => setShowCampaignModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Send size={16} /> Create Campaign
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-glass p-4 rounded-card flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 rounded-card text-primary"><Megaphone size={20} /></div>
          <div>
            <div className="text-xl font-bold text-text-primary font-heading">{campaigns.length}</div>
            <div className="text-xs text-text-secondary">WhatsApp Campaigns</div>
          </div>
        </div>

        <div className="card-glass p-4 rounded-card flex items-center gap-3">
          <div className="p-2.5 bg-green-50 rounded-card text-green-600"><Send size={20} /></div>
          <div>
            <div className="text-xl font-bold text-green-600 font-heading">
              {campaigns.reduce((sum, c) => sum + (c.metrics?.delivered || 0), 0)}
            </div>
            <div className="text-xs text-text-secondary">Messages Delivered</div>
          </div>
        </div>

        <div className="card-glass p-4 rounded-card flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 rounded-card text-blue-600"><Users size={20} /></div>
          <div>
            <div className="text-xl font-bold text-text-primary font-heading">{groups.length}</div>
            <div className="text-xs text-text-secondary">Target Segments</div>
          </div>
        </div>

        <div className="card-glass p-4 rounded-card flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 rounded-card text-amber-600"><Sparkles size={20} /></div>
          <div>
            <div className="text-xl font-bold text-text-primary font-heading">{upsellRules.length || 3}</div>
            <div className="text-xs text-text-secondary">Smart Upsell Pairs</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-rose-panel rounded-button p-1 gap-1 w-fit">
        {([
          ['campaigns', 'WhatsApp Campaigns', MessageSquare],
          ['groups', 'Customer Groups', Users],
          ['upsell', 'Smart Upsell (SUHA AI)', Sparkles],
          ['loyalty', 'Cashback & Loyalty Tiers', Award],
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

      {/* ── TAB 1: WhatsApp Campaigns ── */}
      {activeTab === 'campaigns' && (
        <div className="bg-white rounded-card shadow-card border border-primary-100/40 p-5 space-y-4">
          <h3 className="font-heading font-bold text-base text-text-primary">Campaign History & Delivery Status</h3>

          {campLoading ? (
            <div className="py-12 text-center text-text-secondary"><RefreshCw size={18} className="animate-spin text-primary mx-auto" /> Loading campaigns…</div>
          ) : campaigns.length === 0 ? (
            <div className="p-12 text-center">
              <Megaphone size={48} className="mx-auto text-primary-200 mb-3" />
              <h4 className="font-bold text-text-primary text-base mb-1">No WhatsApp campaigns dispatched yet</h4>
              <p className="text-xs text-text-secondary mb-4">Create your first broadcast offer or birthday greeting to boost repeat visits.</p>
              <button onClick={() => setShowCampaignModal(true)} className="btn-primary mx-auto flex items-center gap-2">
                <Send size={15} /> Create Campaign
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map(c => (
                <div key={c.id} className="p-4 rounded-card border border-gray-200 bg-white hover:border-primary-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-text-primary text-sm">{c.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        c.status === 'SENT' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}>
                        {c.status}
                      </span>
                      {c.targetGroup && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-primary font-bold">
                          {c.targetGroup.name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary line-clamp-2 max-w-xl">{c.message}</p>
                    <div className="text-[11px] text-text-secondary">
                      {c.sentAt ? `Dispatched: ${new Date(c.sentAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : 'Draft'}
                    </div>
                  </div>

                  {/* Delivery Metrics */}
                  <div className="flex items-center gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                    <div className="text-center px-3 py-1.5 bg-rose-50 rounded-input min-w-[70px]">
                      <div className="text-sm font-bold text-primary">{c.metrics?.sent || 0}</div>
                      <div className="text-[10px] text-text-secondary">Sent</div>
                    </div>
                    <div className="text-center px-3 py-1.5 bg-green-50 rounded-input min-w-[70px]">
                      <div className="text-sm font-bold text-green-700">{c.metrics?.delivered || 0}</div>
                      <div className="text-[10px] text-green-600">Delivered</div>
                    </div>
                    <div className="text-center px-3 py-1.5 bg-blue-50 rounded-input min-w-[70px]">
                      <div className="text-sm font-bold text-blue-700">{c.metrics?.read || 0}</div>
                      <div className="text-[10px] text-blue-600">Read</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: Customer Groups ── */}
      {activeTab === 'groups' && (
        <div className="bg-white rounded-card shadow-card border border-primary-100/40 p-5 space-y-4">
          <h3 className="font-heading font-bold text-base text-text-primary">Target Audience Customer Segments</h3>

          {grpLoading ? (
            <div className="py-12 text-center text-text-secondary"><RefreshCw size={18} className="animate-spin text-primary mx-auto" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map(g => (
                <div key={g.id} className="p-4 rounded-card border border-gray-200 bg-white shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-text-primary flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: g.color || '#C2185B' }} />
                      {g.name}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-rose-50 text-primary font-bold">
                      {g.customers?.length || 0} clients
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary">{g.description || 'Custom customer audience group'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: Smart Upsell (SUHA AI) ── */}
      {activeTab === 'upsell' && (
        <div className="bg-white rounded-card shadow-card border border-primary-100/40 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-amber-500" size={20} />
            <div>
              <h3 className="font-heading font-bold text-base text-text-primary">SUHA — Smart Upsell Helper AI</h3>
              <p className="text-xs text-text-secondary">Automatic cross-sell suggestions presented during billing to boost average ticket size.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-card border border-amber-200 bg-amber-50/50 space-y-2">
              <div className="text-xs font-bold text-amber-900 uppercase">Trigger: Haircut & Styling</div>
              <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
                → Suggests: L'Oréal Hair Spa & Mask
              </div>
              <div className="text-xs text-amber-800">Acceptance Rate: <strong>38%</strong> (142 accepted)</div>
            </div>

            <div className="p-4 rounded-card border border-amber-200 bg-amber-50/50 space-y-2">
              <div className="text-xs font-bold text-amber-900 uppercase">Trigger: Fruit Facial</div>
              <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
                → Suggests: De-Tan Glow Pack
              </div>
              <div className="text-xs text-amber-800">Acceptance Rate: <strong>44%</strong> (98 accepted)</div>
            </div>

            <div className="p-4 rounded-card border border-amber-200 bg-amber-50/50 space-y-2">
              <div className="text-xs font-bold text-amber-900 uppercase">Trigger: Pedicure</div>
              <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
                → Suggests: Foot Reflexology 15min
              </div>
              <div className="text-xs text-amber-800">Acceptance Rate: <strong>51%</strong> (210 accepted)</div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: Loyalty & Cashback ── */}
      {activeTab === 'loyalty' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cashback Rules */}
          <div className="bg-white rounded-card shadow-card border border-primary-100/40 p-5 space-y-3">
            <h3 className="font-heading font-bold text-base text-text-primary flex items-center gap-2">
              <Percent className="text-primary" size={18} /> Cashback Rules Config
            </h3>
            <div className="p-3 bg-rose-50 rounded-card border border-primary-100 text-xs text-primary space-y-1">
              <div><strong>Service Billing Cashback:</strong> 5% auto-credited to Customer Wallet</div>
              <div><strong>Min Bill Value:</strong> ₹1,000</div>
              <div><strong>Validity:</strong> 90 days from credit date</div>
            </div>
          </div>

          {/* Loyalty Tiers */}
          <div className="bg-white rounded-card shadow-card border border-primary-100/40 p-5 space-y-3">
            <h3 className="font-heading font-bold text-base text-text-primary flex items-center gap-2">
              <Award className="text-amber-500" size={18} /> Loyalty Tier Matrix
            </h3>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-input bg-gray-50 border border-gray-200 flex justify-between font-medium">
                <span>Silver Tier (Annual Spend &gt; ₹5,000)</span>
                <span className="font-bold text-text-primary">5% Discount</span>
              </div>
              <div className="p-2.5 rounded-input bg-amber-50 border border-amber-200 flex justify-between font-medium">
                <span>Gold Tier (Annual Spend &gt; ₹15,000)</span>
                <span className="font-bold text-amber-800">10% Discount + Free Head Massage</span>
              </div>
              <div className="p-2.5 rounded-input bg-rose-50 border border-primary-200 flex justify-between font-medium">
                <span>Platinum VIP (Annual Spend &gt; ₹30,000)</span>
                <span className="font-bold text-primary">15% Discount + Priority Booking</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showCampaignModal && (
        <CampaignModal
          onClose={() => setShowCampaignModal(false)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
            setShowCampaignModal(false);
          }}
        />
      )}
    </div>
  );
}