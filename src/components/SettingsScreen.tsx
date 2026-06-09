import React, { useState } from 'react';
import { User, Shield, Key, Download, Upload, Trash2, CheckCircle, RefreshCcw, Landmark, Sparkles } from 'lucide-react';
import { TutorProfile } from '../types';

interface SettingsScreenProps {
  tutorProfile: TutorProfile;
  onUpdateProfile: (profile: TutorProfile) => void;
  onImportBackup: (backupData: any) => Promise<boolean>;
  onExportBackup: () => any;
  onClearEverything: () => Promise<void>;
}

export default function SettingsScreen({
  tutorProfile,
  onUpdateProfile,
  onImportBackup,
  onExportBackup,
  onClearEverything,
}: SettingsScreenProps) {
  // Tutor profile form state
  const [name, setName] = useState(tutorProfile.name);
  const [email, setEmail] = useState(tutorProfile.email);
  const [phone, setPhone] = useState(tutorProfile.phone);
  const [upiId, setUpiId] = useState(tutorProfile.upiId || '');
  const [instituteName, setInstituteName] = useState(tutorProfile.instituteName || '');
  const [defaultFee, setDefaultFee] = useState(tutorProfile.defaultFee?.toString() || '0');
  const [signatureText, setSignatureText] = useState(tutorProfile.signatureText || tutorProfile.name);
  
  
  
  // Feedback states
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [importFeedback, setImportFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const handleUpdateProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      alert("Please check that Name, Email and Phone details are populated.");
      return;
    }
    onUpdateProfile({
      name,
      email,
      phone,
      upiId: tutorProfile.upiId || "",
      instituteName: instituteName || "",
      defaultFee: tutorProfile.defaultFee || 0,
      subjects: tutorProfile.subjects || ["Mathematics", "Physics", "Chemistry", "Biology", "Computer", "Mathematics & Computer"],
      signatureText: signatureText || name
    });

    setProfileSuccess(true);
    setTimeout(() => {
      setProfileSuccess(false);
    }, 3000);
  };

  const handleJsonExport = () => {
    const data = onExportBackup();
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    
    // Create direct client-side anchor to download nicely
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `tutor_manager_db_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setBackupSuccess(true);
    setTimeout(() => {
      setBackupSuccess(false);
    }, 3000);
  };

  const handleJsonImportSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportFeedback(null);
    const fileReader = new FileReader();
    const files = e.target.files;
    
    if (!files || files.length === 0) return;

    fileReader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        
        // Basic schema validations checks
        if (parsed.tutor && parsed.batches && parsed.students && parsed.attendance && parsed.payments && parsed.performance) {
          const success = await onImportBackup(parsed);
          if (success) {
            setImportFeedback({ type: 'success', msg: 'Database backup synchronized successfully! Raging page contents.' });
            
            // Reload fields
            setName(parsed.tutor.name);
            setEmail(parsed.tutor.email);
            setPhone(parsed.tutor.phone);
            setUpiId(parsed.tutor.upiId);
            setInstituteName(parsed.tutor.instituteName);
            setDefaultFee(parsed.tutor.defaultFee.toString());
          } else {
            setImportFeedback({ type: 'error', msg: 'Failed to import backup. Storage quota issues.' });
          }
        } else {
          setImportFeedback({ type: 'error', msg: 'Invalid file format. Ensure the JSON backup originates from Tutor Manager.' });
        }
      } catch (err) {
        setImportFeedback({ type: 'error', msg: 'Failed parsing file. Ensure chosen document is a valid JSON database.' });
      }
    };

    fileReader.readAsText(files[0]);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header titles */}
      <div>
        <h1 className="text-2xl font-serif italic text-white tracking-tight">Tutor Settings & Profile</h1>
        <p className="text-xs text-slate-400 mt-1 font-mono uppercase tracking-widest">Configure defaults & back up registers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile config Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-dark-card border border-white/5 rounded-3xl p-6 shadow-xl space-y-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <User className="text-gold w-4 h-4" />
              Tutor Roster Identification Card
            </h3>

            <form onSubmit={handleUpdateProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs text-slate-400 font-mono">Tutor Full Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-white/5 border border-white/5 focus:border-gold rounded-lg text-white font-sans outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs text-slate-400 font-mono">Contact Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-white/5 border border-white/5 focus:border-gold rounded-lg text-white font-sans outline-none transition-all"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-slate-400 font-mono">Contact Call Phone *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-white/5 border border-white/5 focus:border-gold rounded-lg text-white font-mono outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs text-slate-400 font-mono">Academy / Institute Name (Optional)</label>
                <input
                  type="text"
                  value={instituteName}
                  onChange={e => setInstituteName(e.target.value)}
                  placeholder="e.g. Kumar Classes / Private Tutorial Hub (Optional)"
                  className="w-full px-3.5 py-2.5 text-xs bg-white/5 border border-white/5 focus:border-gold rounded-lg text-white font-sans outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs text-slate-400 font-mono">Typed Signature Text *</label>
                  <input
                    type="text"
                    value={signatureText}
                    onChange={e => setSignatureText(e.target.value)}
                    placeholder="Name as you want it signed"
                    className="w-full px-3.5 py-2.5 text-xs bg-white/5 border border-white/5 focus:border-gold rounded-lg text-white font-sans outline-none transition-all"
                    required
                  />
                  <span className="text-[9px] text-slate-500 block">This custom text is displayed on student report cards and PDF invoices.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-slate-400 font-mono">Signature Render Preview</label>
                  <div className="h-16 w-full bg-[#121318] border border-white/5 rounded-xl flex items-center justify-center overflow-hidden relative group">
                    <span className="absolute inset-0 bg-gold/5 blur-md opacity-30 group-hover:opacity-50 transition-opacity"></span>
                    <span 
                      className="text-2xl text-gold tracking-wider select-none relative z-10"
                      style={{ fontFamily: "'Ballet', cursive" }}
                    >
                      {signatureText || name}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs text-slate-400 font-mono">Offered Speciality Subjects</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {["Mathematics", "Physics", "Chemistry", "Biology", "Computer", "Mathematics & Computer"].map(sub => (
                    <span key={sub} className="px-3 py-1 bg-gold/10 text-gold border border-gold/20 rounded-full text-xs font-semibold">
                      {sub}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Restricted exclusively to ICSE Science subjects.</p>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                <div>
                  {profileSuccess && (
                     <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
                       <CheckCircle className="w-3.5 h-3.5" /> Profiles credentials synchronized successfully!
                     </span>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gold text-dark-bg hover:bg-gold-light text-xs font-bold uppercase tracking-widest text-[10px] rounded-lg cursor-pointer transition-all active:scale-95 shadow-[0_0_15px_rgba(212,175,55,0.12)]"
                >
                  Save Profiles
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Backups Sync panels */}
        <div className="space-y-6">
          <div className="bg-dark-card border border-white/5 rounded-3xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Shield className="text-gold w-4 h-4" />
              Backup & Sync Center
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed">Export your pupils directory, attendance records, exam scores, and payment ledgers as a digital backup sheet.</p>

            <div className="space-y-3.5 pt-2">
              {/* Json Export */}
              <button
                onClick={handleJsonExport}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/5 rounded-lg text-xs font-semibold cursor-pointer transition-all"
              >
                <Download className="w-4 h-4" />
                Export Ledger (JSON)
              </button>
              {backupSuccess && (
                <p className="text-[10px] text-emerald-400 font-mono text-center">✓ Download triggered successfully.</p>
              )}

              {/* Json Import wrapper */}
              <div className="relative pt-2 border-t border-white/5">
                <label className="block text-center text-xs font-semibold text-slate-400 hover:text-white bg-white/5 border border-white/5 hover:border-gold/30 p-2 rounded-lg cursor-pointer transition-all">
                  <Upload className="w-3.5 h-3.5 inline mr-1" />
                  Restore Ledger Database
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleJsonImportSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </label>
              </div>

              {/* Sync Feedback messages logs */}
              {importFeedback && (
                <div className={`p-3 rounded-lg text-[10px] leading-relaxed border ${
                  importFeedback.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-440'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-440'
                }`}>
                  {importFeedback.msg}
                </div>
              )}
            </div>
          </div>

          <div className="bg-dark-card border border-white/5 rounded-3xl p-5 shadow-xl space-y-3.5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Trash2 className="text-rose-450 w-4 h-4" />
              System Purge Board
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">This completely clears all recorded students, batches, attendance history, and payment transactions cached on this browser.</p>
            <button
              onClick={async () => {
                const userInput = prompt("WARNING: This will permanently delete ALL recorded data on this device and the cloud including student histories, receipts, and profiles. This is NOT reversible.\n\nType 'PURGE' to proceed:");
                if (userInput === 'PURGE') {
                  await onClearEverything();
                  alert("Database successfully purged.");
                  window.location.reload();
                }
              }}
              className="w-full px-4 py-2 bg-rose-600/10 hover:bg-rose-600 border border-rose-500/25 hover:text-white text-rose-400 rounded-lg text-xs font-semibold cursor-pointer transition-all text-center"
            >
              Purge Database Storage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
