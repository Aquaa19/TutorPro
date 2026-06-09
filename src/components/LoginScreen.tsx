import React, { useState, useEffect } from 'react';
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../utils/firebase';
import { GraduationCap, Lock, LogIn, AlertCircle } from 'lucide-react';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        setLoading(true);
        const result = await getRedirectResult(auth);
        if (result) {
          const user = result.user;
          const allowedEmail = import.meta.env.VITE_ALLOWED_EMAIL;
          if (user.email !== allowedEmail) {
            await signOut(auth);
            setError(`Access Denied: ${user.email} is not authorized to access this dashboard.`);
          }
        }
      } catch (err: any) {
        console.error("Redirect auth error:", err);
        setError(err.message || 'An error occurred during redirect sign-in.');
      } finally {
        setLoading(false);
      }
    };
    
    // Check redirect result if we are in WebView or mobile browser
    const isWebViewOrMobile = window.location.search.includes('webview=true') || 
                              /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|wv|WebView/i.test(navigator.userAgent);
    if (isWebViewOrMobile) {
      checkRedirectResult();
    }
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const isWebViewOrMobile = window.location.search.includes('webview=true') || 
                                /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|wv|WebView/i.test(navigator.userAgent);
      
      if (isWebViewOrMobile) {
        await signInWithRedirect(auth, googleProvider);
      } else {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        const allowedEmail = import.meta.env.VITE_ALLOWED_EMAIL;
        
        if (user.email !== allowedEmail) {
          // Sign out immediately if not authorized
          await signOut(auth);
          setError(`Access Denied: ${user.email} is not authorized to access this dashboard.`);
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'An error occurred during authentication.');
      }
    } finally {
      // For redirect flow, we keep loading true since page is redirecting away
      const isWebViewOrMobile = window.location.search.includes('webview=true') || 
                                /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|wv|WebView/i.test(navigator.userAgent);
      if (!isWebViewOrMobile) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-gray-200 font-sans flex items-center justify-center relative px-4 overflow-hidden antialiased">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.08),rgba(255,255,255,0))]"></div>
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-dark-sidebar border border-white/5 rounded-2xl p-8 relative z-10 shadow-2xl backdrop-blur-md">
        {/* Logo and Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-tr from-gold to-amber-500 flex items-center justify-center shadow-lg shadow-gold/20">
            <GraduationCap className="w-7 h-7 text-dark-bg" />
          </div>
          <div>
            <h1 className="text-2xl font-serif italic text-gold tracking-wider">TutorPro<span className="text-white font-sans not-italic font-light opacity-50">.OS</span></h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mt-1">Apex Tutoring Ecosystem</p>
          </div>
        </div>

        {/* Info card */}
        <div className="bg-white/5 border border-white/5 rounded-xl p-5 mb-6 text-center space-y-2">
          <Lock className="w-5 h-5 text-gold/80 mx-auto" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Private Dashboard</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            This dashboard is restricted to authorized personnel. Please sign in with your whitelisted Google account to access your command center.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-300 leading-relaxed">{error}</p>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-gold to-amber-500 hover:from-amber-500 hover:to-gold text-dark-bg font-bold uppercase tracking-wider text-xs py-3.5 px-4 rounded-xl shadow-lg shadow-gold/15 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-dark-bg border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <LogIn className="w-4 h-4" />
          )}
          <span>{loading ? 'Authenticating...' : 'Sign in with Google'}</span>
        </button>
      </div>
    </div>
  );
}
