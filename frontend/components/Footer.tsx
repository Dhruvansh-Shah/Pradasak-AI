import Link from 'next/link';
import { Landmark, HeartHandshake, ShieldCheck, HelpCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#071426] text-white border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                <Landmark className="w-5 h-5 text-amber-400" />
              </div>
              <span className="font-extrabold text-base text-white tracking-tight">
                Pradarshak AI (प्रदर्शक AI)
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              An intelligent channel finance discovery platform engineered for Scheduled Caste beneficiaries. Grounded recommendations, accurate mathematical EMI models, and verified partner branch locator.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Navigation
            </div>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>
                <Link href="/schemes" className="hover:text-white transition-colors">
                  Loan Schemes Catalog
                </Link>
              </li>
              <li>
                <Link href="/chat" className="hover:text-white transition-colors">
                  AI Scheme Recommender
                </Link>
              </li>
              <li>
                <Link href="/partners" className="hover:text-white transition-colors">
                  Channel Partner Map
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-white transition-colors">
                  Admin Management
                </Link>
              </li>
            </ul>
          </div>

          {/* Governance & Trust */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Governance &amp; Support
            </div>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>NSFDC Guidelines</span>
              </li>
              <li className="flex items-center gap-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-amber-400" />
                <span>Ministry of Social Justice</span>
              </li>
              <li className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                <span>Smart India Hackathon</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2024 National Scheduled Castes Finance and Development Corporation (NSFDC). All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link href="#" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
            <span>•</span>
            <Link href="#" className="hover:text-slate-300 transition-colors">Disclaimer</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
