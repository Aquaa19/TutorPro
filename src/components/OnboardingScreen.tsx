import React, { useState, useEffect } from 'react';
import { auth, db } from '../utils/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { TutorProfile } from '../types';
import { GraduationCap, ShieldCheck, CheckSquare, Sparkles, User, Landmark, Phone, BookOpen, DollarSign, Wallet, FileSignature } from 'lucide-react';
import { motion } from 'framer-motion';

interface OnboardingScreenProps {
  currentUser: any;
  onboardingProfile: TutorProfile;
  onComplete: () => void;
}

export default function OnboardingScreen({ currentUser, onboardingProfile, onComplete }: OnboardingScreenProps) {
  const [name, setName] = useState(onboardingProfile.name || currentUser.displayName || '');
  const [phone, setPhone] = useState(onboardingProfile.phone || '');
  const [instituteName, setInstituteName] = useState(onboardingProfile.instituteName || '');
  const [defaultFee, setDefaultFee] = useState<number | string>(onboardingProfile.defaultFee || 0);
  const [upiId, setUpiId] = useState(onboardingProfile.upiId || '');
  const [subjectsInput, setSubjectsInput] = useState(onboardingProfile.subjects ? onboardingProfile.subjects.join(', ') : 'Mathematics, Physics, Chemistry, Biology, Computer');
  const [signatureText, setSignatureText] = useState(onboardingProfile.signatureText || name);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill signature text when name changes initially
  useEffect(() => {
    if (!onboardingProfile.signatureText && name) {
      setSignatureText(name);
    }
  }, [name, onboardingProfile.signatureText]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !signatureText.trim()) {
      setError('Please fill in all required profile fields.');
      return;
    }
    if (!agreeTerms) {
      setError('You must accept the Terms of Service & Privacy Policy to proceed.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const parsedSubjects = subjectsInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const finalProfile: TutorProfile = {
        name: name.trim(),
        email: currentUser.email || '',
        phone: phone.trim(),
        subjects: parsedSubjects,
        defaultFee: Number(defaultFee) || 0,
        upiId: upiId.trim(),
        instituteName: instituteName.trim(),
        onboarded: true,
        signatureText: signatureText.trim()
      };

      await setDoc(doc(db, 'users', currentUser.uid, 'profile', 'info'), finalProfile);
      onComplete();
    } catch (err: any) {
      console.error("Onboarding submission error:", err);
      setError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-gray-200 font-sans flex items-center justify-center py-12 px-4 overflow-y-auto antialiased">
      {/* Background radial lines */}
      <div className="absolute inset-x-0 top-0 h-96 bg-gold/5 blur-3xl pointer-events-none -z-10"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl bg-dark-sidebar border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl relative"
      >
        {/* Header Logo banner */}
        <div className="flex flex-col items-center text-center space-y-2 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-gold to-amber-500 flex items-center justify-center shadow-lg shadow-gold/15">
            <GraduationCap className="w-7 h-7 text-dark-bg" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-serif italic text-white tracking-wide">
              Welcome to <span className="text-gold">TutorPro.OS</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mt-1">Complete your academy profile setup</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl text-xs mb-6 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Profile Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-450 border-b border-white/5 pb-2 font-bold">1. Academy & Identity</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <User className="w-3 h-3 text-gold/80" /> Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Prof. Rajesh Kumar"
                  className="w-full px-3.5 py-2.5 text-xs bg-white/[0.01] border border-white/10 hover:bg-white/[0.03] focus:border-gold/50 rounded-xl text-white outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-gold/80" /> Mobile / Contact Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3.5 py-2.5 text-xs bg-white/[0.01] border border-white/10 hover:bg-white/[0.03] focus:border-gold/50 rounded-xl text-white font-mono outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Landmark className="w-3 h-3 text-gold/80" /> Institute / Academy Name (Optional)
              </label>
              <input
                type="text"
                value={instituteName}
                onChange={e => setInstituteName(e.target.value)}
                placeholder="e.g. Kumar Classes / Private Tutorial Hub (Optional)"
                className="w-full px-3.5 py-2.5 text-xs bg-white/[0.01] border border-white/10 hover:bg-white/[0.03] focus:border-gold/50 rounded-xl text-white outline-none transition-all"
              />
            </div>
          </div>

          {/* Section 2: Teaching & Payments */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-450 border-b border-white/5 pb-2 font-bold">2. Tuition Configurations</h3>
            
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <BookOpen className="w-3 h-3 text-gold/80" /> Subjects Taught (comma-separated)
              </label>
              <input
                type="text"
                value={subjectsInput}
                onChange={e => setSubjectsInput(e.target.value)}
                placeholder="e.g. Mathematics, Physics, Chemistry"
                className="w-full px-3.5 py-2.5 text-xs bg-white/[0.01] border border-white/10 hover:bg-white/[0.03] focus:border-gold/50 rounded-xl text-white outline-none transition-all"
              />
              <span className="text-[9px] text-slate-500 block">Separating subjects with commas makes them selectable tags when adding new batches.</span>
            </div>

          </div>

          {/* Section 3: Typed Signature */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-450 border-b border-white/5 pb-2 font-bold">3. Invoice Signature</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <FileSignature className="w-3 h-3 text-gold/80" /> Typed Signature Text <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={signatureText}
                  onChange={e => setSignatureText(e.target.value)}
                  placeholder="Name as you want it signed"
                  className="w-full px-3.5 py-2.5 text-xs bg-white/[0.01] border border-white/10 hover:bg-white/[0.03] focus:border-gold/50 rounded-xl text-white outline-none transition-all"
                />
                <span className="text-[9px] text-slate-500 block">This custom text is displayed on student report cards and PDF invoices.</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Signature Render Preview</label>
                <div className="h-16 w-full bg-[#121318] border border-white/5 rounded-2xl flex items-center justify-center overflow-hidden relative group">
                  <span className="absolute inset-0 bg-gold/5 blur-md opacity-30 group-hover:opacity-50 transition-opacity"></span>
                  <span 
                    className="text-2xl text-gold tracking-wider select-none relative z-10"
                    style={{ fontFamily: "'Ballet', cursive" }}
                  >
                    {signatureText || 'Your Signature'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Compliance check */}
          <div className="pt-4 flex items-start gap-3">
            <button
              type="button"
              onClick={() => setAgreeTerms(!agreeTerms)}
              className="mt-0.5 shrink-0 text-slate-450 hover:text-white cursor-pointer select-none transition-colors"
            >
              {agreeTerms ? (
                <CheckSquare className="w-4 h-4 text-gold" />
              ) : (
                <div className="w-4 h-4 border border-white/20 rounded-sm hover:border-gold transition-colors"></div>
              )}
            </button>
            <p className="text-[11px] text-slate-400 leading-relaxed select-none">
              I agree to the <span className="text-gold hover:underline cursor-pointer">Terms of Service</span> and <span className="text-gold hover:underline cursor-pointer">Privacy Policy</span>. I authorize TutorPro.OS to securely store my data collections (student directory, finances, schedules) in their encrypted Firestore database.
            </p>
          </div>

          {/* Submit Action */}
          <div className="border-t border-white/5 pt-6 flex justify-end">
            <button
              type="submit"
              disabled={loading || !agreeTerms}
              className="px-8 py-3 bg-gradient-to-r from-gold to-amber-500 hover:from-amber-500 hover:to-gold text-dark-bg font-bold uppercase tracking-widest text-[10px] rounded-xl shadow-[0_0_15px_rgba(212,175,55,0.15)] disabled:opacity-50 disabled:pointer-events-none cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-dark-bg border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-dark-bg" />
                  <span>Complete Onboarding</span>
                </>
              )}
            </button>
          </div>

        </form>
      </motion.div>
    </div>
  );
}
