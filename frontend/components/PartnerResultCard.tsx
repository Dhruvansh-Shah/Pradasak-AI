'use client';

import { Building2, Landmark, MapPin, Phone, CheckCircle, Navigation } from 'lucide-react';

interface Partner {
  id: number;
  name: string;
  partner_type: string;
  city: string;
  state: string;
  distance_km?: number;
  address?: string;
  phone?: string;
  fund_availability_status?: string;
  npa_percent?: number | null;
  supported_schemes?: string[];
}

const TYPE_META: Record<string, { label: string; color: string; bg: string; border: string; Icon: React.ElementType }> = {
  SCA:     { label: 'State Agency (SCA)',   color: 'text-blue-800',   bg: 'bg-blue-50',   border: 'border-blue-200',   Icon: Building2 },
  RRB:     { label: 'Regional Rural Bank',  color: 'text-emerald-800',bg: 'bg-emerald-50',border: 'border-emerald-200',Icon: Landmark },
  NBFC:    { label: 'NBFC-MFI Partner',     color: 'text-purple-800', bg: 'bg-purple-50', border: 'border-purple-200', Icon: Building2 },
  default: { label: 'Channel Partner',     color: 'text-slate-800',  bg: 'bg-slate-50',  border: 'border-slate-200',  Icon: Building2 },
};

export default function PartnerResultCard({ partner, rank }: { partner: Partner; rank?: number }) {
  const meta = TYPE_META[partner.partner_type] || TYPE_META.default;
  const Icon = meta.Icon;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl ${meta.bg} ${meta.color} flex items-center justify-center flex-shrink-0 border ${meta.border}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color} ${meta.border}`}>
                {meta.label}
              </span>
              {partner.fund_availability_status === 'available' && (
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Funds Ready
                </span>
              )}
            </div>
            <h4 className="font-extrabold text-sm text-slate-900 mt-1">
              {partner.name}
            </h4>
          </div>
        </div>

        {partner.distance_km != null && (
          <div className="text-right flex-shrink-0 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
            <div className="text-sm font-extrabold text-[#0b1f3a]">
              {partner.distance_km < 1 ? `${(partner.distance_km * 1000).toFixed(0)}m` : `${partner.distance_km.toFixed(1)} km`}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">distance</div>
          </div>
        )}
      </div>

      {partner.address && (
        <div className="flex items-start gap-2 text-xs text-slate-600">
          <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
          <span>{partner.address}, {partner.city}, {partner.state}</span>
        </div>
      )}

      {partner.phone && (
        <div className="flex items-center gap-2 text-xs font-semibold text-[#0b1f3a]">
          <Phone className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
          <a href={`tel:${partner.phone}`} className="hover:underline">
            {partner.phone}
          </a>
        </div>
      )}

      {partner.supported_schemes && partner.supported_schemes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {partner.supported_schemes.map((s) => (
            <span key={s} className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
