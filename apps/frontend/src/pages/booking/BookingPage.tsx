import { useState, useMemo } from 'react';
import { Calendar, Clock, User, Phone, Mail, Sparkles, CheckCircle2, ChevronRight, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { MOCK_SERVICES } from '../../utils/mockData';
import { formatCurrency } from '../../utils/cn';

const TIME_SLOTS = [
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM',
];

export default function BookingPage() {
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('11:00 AM');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookedAppointment, setBookedAppointment] = useState<any>(null);
  const [search, setSearch] = useState('');

  // Fetch services for public booking
  const { data: services = MOCK_SERVICES } = useQuery({
    queryKey: ['public-services'],
    queryFn: async () => {
      try {
        const r = await api.get('/appointments/public-services');
        const list = r.data.data;
        return Array.isArray(list) && list.length > 0 ? list : MOCK_SERVICES;
      } catch {
        return MOCK_SERVICES;
      }
    },
  });

  const filteredServices = useMemo(() => {
    if (!search) return services;
    const q = search.toLowerCase();
    return services.filter((s: any) => s.name.toLowerCase().includes(q) || s.category?.name?.toLowerCase().includes(q));
  }, [services, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) {
      toast.error('Please select a salon service!');
      return;
    }
    if (!name || !phone) {
      toast.error('Name and 10-digit phone number are required!');
      return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setIsSubmitting(true);
    try {
      const [timeStr, period] = selectedTimeSlot.split(' ');
      let [hours, minutes] = timeStr.split(':').map(Number);
      if (period === 'PM' && hours < 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      const startTime = new Date(`${selectedDate}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);

      const res = await api.post('/appointments/public-booking', {
        name,
        phone,
        email: email || undefined,
        serviceId: selectedService.id,
        startTime: startTime.toISOString(),
        notes,
      });

      const appt = res.data.data;
      setBookedAppointment(appt);
      toast.success('Appointment booked successfully! 🌹');
    } catch (err: any) {
      // SECURITY: A failed booking must show an error — never a fake success confirmation.
      // Showing "Appointment booked (Demo)" when the server rejected the request
      // means customers believe they have an appointment when they do not.
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Booking failed. Please try again or call us directly.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (bookedAppointment) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-card shadow-2xl border border-primary-100 max-w-lg w-full p-8 text-center space-y-6 animate-scale-up">
          <div className="w-20 h-20 bg-rose-100 text-primary rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 size={48} />
          </div>
          <div>
            <span className="badge-rose text-xs font-bold tracking-widest uppercase px-3 py-1">Booking Confirmed</span>
            <h1 className="font-heading font-bold text-2xl text-text-primary mt-2">
              We Can't Wait to See You!
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              Your luxury appointment has been reserved at DreamGirl Family Salon.
            </p>
          </div>

          <div className="bg-rose-panel/60 p-4 rounded-card border border-primary-100 text-left space-y-3">
            <div className="flex items-center justify-between text-xs border-b border-rose-200/60 pb-2">
              <span className="text-text-secondary">Customer Name</span>
              <span className="font-bold text-text-primary">{name || bookedAppointment.customerName}</span>
            </div>
            <div className="flex items-center justify-between text-xs border-b border-rose-200/60 pb-2">
              <span className="text-text-secondary">Phone Number</span>
              <span className="font-mono text-text-primary">{phone || bookedAppointment.customerPhone}</span>
            </div>
            <div className="flex items-center justify-between text-xs border-b border-rose-200/60 pb-2">
              <span className="text-text-secondary">Service</span>
              <span className="font-bold text-primary">{selectedService?.name || 'Salon Service'}</span>
            </div>
            <div className="flex items-center justify-between text-xs border-b border-rose-200/60 pb-2">
              <span className="text-text-secondary">Date & Time</span>
              <span className="font-bold text-text-primary">{selectedDate} @ {selectedTimeSlot}</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-text-secondary">Estimated Price</span>
              <span className="font-heading font-bold text-lg text-primary">{formatCurrency(selectedService?.price || 0)}</span>
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-card border border-amber-200 text-xs text-amber-800 text-left flex items-start gap-2">
            <ShieldCheck size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <span>Please arrive 10 minutes prior to your appointment time. Payments are collected at the salon.</span>
          </div>

          <button
            onClick={() => { setBookedAppointment(null); setSelectedService(null); }}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2 font-bold"
          >
            Book Another Appointment <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="bg-rose-gradient text-white shadow-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur-xs font-heading font-bold text-xl">
              🌹
            </div>
            <div>
              <h1 className="font-heading font-bold text-lg tracking-wide text-white leading-tight">DreamGirl</h1>
              <p className="text-[10px] text-pink-100 uppercase tracking-widest font-medium">Family Salon & Spa</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-pink-100">
            <span className="hidden sm:inline flex items-center gap-1">
              <ShieldCheck size={14} /> Official Online Booking Portal
            </span>
            <a href="tel:+919876543210" className="bg-white/20 px-3 py-1.5 rounded-full hover:bg-white/30 text-white font-semibold transition-all">
              📞 Call Salon
            </a>
          </div>
        </div>
      </header>

      <div className="bg-gradient-to-b from-rose-900 to-rose-950 text-white py-10 px-4 text-center">
        <div className="max-w-2xl mx-auto space-y-3">
          <span className="badge-rose bg-white/10 text-pink-200 border-white/20 text-xs px-3 py-1 rounded-full uppercase tracking-wider font-semibold">
            ✨ Premium Salon Experience
          </span>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white">
            Book Your Beauty Appointment
          </h2>
          <p className="text-pink-100 text-sm max-w-lg mx-auto">
            Choose your favorite service, select a preferred date and time, and treat yourself to luxury care.
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-7 space-y-6">
            <div className="card-glass p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-base text-text-primary flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">1</span>
                  Select Salon Service
                </h3>
                {selectedService && (
                  <span className="badge-rose text-xs font-bold">
                    Selected: {selectedService.name}
                  </span>
                )}
              </div>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search services (e.g. Haircut, Facial, Spa...)"
                className="input-field text-xs"
              />

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {filteredServices.map((s: any) => {
                  const isSelected = selectedService?.id === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedService(s)}
                      className={`p-4 rounded-card border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-rose-50 border-primary ring-2 ring-primary-200 shadow-md'
                          : 'bg-white border-gray-200 hover:border-primary-200 hover:bg-rose-50/40'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-heading font-bold text-sm text-text-primary">{s.name}</h4>
                          <span className="badge-gray text-[9px]">{s.duration || 30} mins</span>
                        </div>
                        {s.description && (
                          <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">{s.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-heading font-bold text-base text-primary">{formatCurrency(s.price)}</p>
                        <span className={`text-[10px] font-bold ${isSelected ? 'text-primary' : 'text-text-secondary'}`}>
                          {isSelected ? '✓ Selected' : 'Tap to select'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card-glass p-6 space-y-4">
              <h3 className="font-heading font-bold text-base text-text-primary flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">2</span>
                Choose Date & Time Slot
              </h3>

              <div>
                <label className="form-label flex items-center gap-1">
                  <Calendar size={14} /> Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="input-field text-sm"
                  required
                />
              </div>

              <div>
                <label className="form-label flex items-center gap-1">
                  <Clock size={14} /> Available Time Slots
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-40 overflow-y-auto pt-1">
                  {TIME_SLOTS.map((slot) => {
                    const isSelected = selectedTimeSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTimeSlot(slot)}
                        className={`py-2 px-1 text-center rounded-card border text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-primary text-white border-primary shadow-xs font-bold'
                            : 'bg-white border-gray-200 text-text-secondary hover:border-gray-300'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="card-glass p-6 space-y-4">
              <h3 className="font-heading font-bold text-base text-text-primary flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">3</span>
                Your Contact Information
              </h3>

              <div>
                <label className="form-label flex items-center gap-1">
                  <User size={14} /> Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="form-label flex items-center gap-1">
                  <Phone size={14} /> Phone Number *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile number"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="form-label flex items-center gap-1">
                  <Mail size={14} /> Email (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="For confirmation receipt"
                  className="input-field"
                />
              </div>

              <div>
                <label className="form-label">Special Requests / Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any preferences or stylist notes..."
                  rows={2}
                  className="input-field text-xs"
                />
              </div>
            </div>

            <div className="bg-rose-gradient text-white p-6 rounded-card shadow-xl space-y-4">
              <h4 className="font-heading font-bold text-lg text-white border-b border-white/20 pb-2">
                Appointment Summary
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-pink-100">
                  <span>Selected Service:</span>
                  <span className="font-bold text-white">{selectedService ? selectedService.name : 'None'}</span>
                </div>
                <div className="flex items-center justify-between text-pink-100">
                  <span>Date:</span>
                  <span className="font-bold text-white">{selectedDate}</span>
                </div>
                <div className="flex items-center justify-between text-pink-100">
                  <span>Time Slot:</span>
                  <span className="font-bold text-white">{selectedTimeSlot}</span>
                </div>
                <div className="border-t border-white/20 pt-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-pink-100">Total Payable:</span>
                  <span className="font-heading font-bold text-2xl text-white">
                    {formatCurrency(selectedService?.price || 0)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !selectedService}
                className="w-full bg-white text-primary font-heading font-bold py-3.5 px-4 rounded-button shadow-lg hover:bg-pink-50 transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Processing Booking...</span>
                ) : (
                  <>Confirm Online Booking <Sparkles size={18} /></>
                )}
              </button>
            </div>
          </div>
        </form>
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-text-secondary mt-auto">
        <p>© 2026 DreamGirl Family Salon & Spa. Powered by DreamGirl POS.</p>
      </footer>
    </div>
  );
}
