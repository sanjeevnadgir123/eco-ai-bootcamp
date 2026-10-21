import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  QrCode, 
  FileCheck2, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  ArrowRight, 
  Check, 
  Copy, 
  Sparkles, 
  Download, 
  Clock, 
  ExternalLink,
  GraduationCap,
  BookOpen
} from 'lucide-react';
import { emailVerificationService } from '../services/emailVerificationService';
import { eligibilityService, EligibilityResult } from '../services/eligibilityService';
import { registrationService } from '../services/registrationService';
import { StudentRegistration } from '../types';

import paymentQrImg from '../assets/payment-qr.png';

export const RegistrationFlow: React.FC = () => {
  // Flag to temporarily close public registrations on frontend (Limit reached: 130 students)
  // Set to false to restore the full registration flow
  const IS_REGISTRATION_CLOSED = true;

  // Step indicator 1 to 6
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1 Form Data
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    usn: '',
    semester: '',
  });
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});
  const [step1Loading, setStep1Loading] = useState<boolean>(false);

  // Step 2 Email Verification State
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [verificationToken, setVerificationToken] = useState<string>('');
  const [cooldown, setCooldown] = useState<number>(0);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isSendingCode, setIsSendingCode] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<string>('');



  // Step 3 Attendance Eligibility State
  const [eligibilityLoading, setEligibilityLoading] = useState<boolean>(false);
  const [eligibilityData, setEligibilityData] = useState<EligibilityResult | null>(null);
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);
  const [simulateGlitch, setSimulateGlitch] = useState<boolean>(false);

  // Step 4 & 5 Payment and UTR State
  const [tempRegId, setTempRegId] = useState<string>('');
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [utrConfirmed, setUtrConfirmed] = useState<boolean>(false);
  const [utrError, setUtrError] = useState<string>('');
  const [utrSubmitting, setUtrSubmitting] = useState<boolean>(false);

  // Step 6 Final Registered Record
  const [confirmedRegistration, setConfirmedRegistration] = useState<StudentRegistration | null>(null);
  const [copiedId, setCopiedId] = useState<boolean>(false);

  // Cooldown countdown effect
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Trigger confetti on successful confirmation
  useEffect(() => {
    if (currentStep === 5) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00f5ff', '#3b82f6', '#ec4899', '#8b5cf6'],
        });
      } catch {
        // gracefully handle if disabled
      }
    }
  }, [currentStep]);

  // ==========================================
  // STEP 1 HANDLERS
  // ==========================================
  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!formData.fullName.trim()) {
      errs.fullName = 'Please enter your full name.';
    } else if (formData.fullName.trim().length < 3) {
      errs.fullName = 'Full name must be at least 3 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errs.email = 'Please enter your college email address.';
    } else if (!emailRegex.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email format.';
    }

    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!formData.phone.trim()) {
      errs.phone = 'Please enter your phone number.';
    } else if (cleanPhone.length < 10) {
      errs.phone = 'Please enter a valid 10-digit phone number.';
    }

    if (!formData.usn.trim()) {
      errs.usn = 'Please enter your USN.';
    }

    if (!formData.semester.trim()) {
      errs.semester = 'Please enter or select your semester.';
    }

    setStep1Errors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1()) return;

    setStep1Loading(true);
    setStep1Errors({});

    try {
      // Duplicate registration check
      const isDuplicate = await registrationService.checkDuplicateEmail(formData.email);
      if (isDuplicate) {
        setStep1Errors({
          email: 'This email is already registered for the bootcamp. Please check with coordinators or admin.',
        });
        setStep1Loading(false);
        return;
      }

      // Automatically dispatch initial verification code
      const result = await emailVerificationService.sendVerificationCode(formData.email);
      if (result.success) {
        setCooldown(30);
        setCurrentStep(2);
      } else {
        setStep1Errors({
          email: result.message || 'Failed to dispatch verification code.',
        });
      }
    } catch (err: any) {
      setStep1Errors({
        email: err.message || 'Error validating registration details.',
      });
    } finally {
      setStep1Loading(false);
    }
  };

  // ==========================================
  // STEP 2 HANDLERS (EMAIL VERIFICATION)
  // ==========================================
  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setIsSendingCode(true);
    setVerificationError('');
    try {
      const result = await emailVerificationService.sendVerificationCode(formData.email);
      if (result.success) {
        setCooldown(30);
      } else {
        setVerificationError(result.message);
      }

    } catch (err: any) {
      setVerificationError(err.message || 'Failed to resend verification code.');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.trim().length !== 6) {
      setVerificationError('Please enter the 6-digit verification code.');
      return;
    }

    setIsVerifying(true);
    setVerificationError('');

    try {
      const result = await emailVerificationService.verifyCode(formData.email, verificationCode);
      if (result.success) {
        if (result.verificationToken) {
          setVerificationToken(result.verificationToken);
        }

        // Generate pre-allocated Registration ID for display
        const previewId = registrationService.generateRegistrationId();
        setTempRegId(previewId);

        // Advance directly to Step 3: Payment QR Code
        setCurrentStep(3);
      } else {

        setVerificationError(result.message);
      }
    } catch (err: any) {
      setVerificationError(err.message || 'Verification service error.');
    } finally {
      setIsVerifying(false);
    }
  };

  // ==========================================
  // STEP 3 HANDLERS (ATTENDANCE ELIGIBILITY)
  // ==========================================
  const fetchEligibility = async (email: string) => {
    setEligibilityLoading(true);
    setEligibilityError(null);

    try {
      const data = await eligibilityService.checkEligibility(email, simulateGlitch);
      setEligibilityData(data);
    } catch (err: any) {
      setEligibilityError(
        err.message || 'Backend attendance eligibility service failed to respond. Please retry.'
      );
      setEligibilityData(null);
    } finally {
      setEligibilityLoading(false);
    }
  };

  const handleProceedToPayment = () => {
    if (eligibilityData) {
      setCurrentStep(4);
    }
  };

  // ==========================================
  // STEP 5 HANDLERS (UTR SUBMISSION)
  // ==========================================
  const handleUtrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrNumber.trim()) {
      setUtrError('Please enter the 12-digit UTR or transaction reference number.');
      return;
    }
    if (utrNumber.trim().length < 8) {
      setUtrError('Please enter a valid transaction reference (at least 8 characters).');
      return;
    }
    if (!utrConfirmed) {
      setUtrError('Please check the confirmation box verifying your payment.');
      return;
    }

    const trimmedUsn = formData.usn ? formData.usn.trim().toUpperCase() : '';
    const trimmedSemester = formData.semester ? formData.semester.trim() : '';

    if (!trimmedUsn) {
      setUtrError('Student USN is missing. Please return to Step 1 and enter your USN.');
      return;
    }
    if (!trimmedSemester) {
      setUtrError('Student Semester is missing. Please return to Step 1 and select your Semester.');
      return;
    }

    setUtrSubmitting(true);
    setUtrError('');

    try {
      const created = await registrationService.submitRegistration({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        usn: trimmedUsn,
        semester: trimmedSemester,
        feeAmount: 200,
        utrNumber: utrNumber.trim(),
        verificationToken,
      });

      setConfirmedRegistration(created);
      setCurrentStep(5);
    } catch (err: any) {
      setUtrError(err.message || 'Failed to submit registration. Please verify UTR reference.');
    } finally {
      setUtrSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const restartFlow = () => {
    setFormData({ fullName: '', email: '', phone: '', usn: '', semester: '' });
    setVerificationCode('');
    setVerificationToken('');
    setEligibilityData(null);
    setEligibilityError(null);
    setUtrNumber('');
    setUtrConfirmed(false);
    setConfirmedRegistration(null);
    setCurrentStep(1);
  };



  // Step Progress Indicator items
  const steps = [
    { num: 1, label: 'Student Info' },
    { num: 2, label: 'Verification' },
    { num: 3, label: 'Payment QR' },
    { num: 4, label: 'Submit UTR' },
    { num: 5, label: 'Submitted' },
  ];

  return (
    <section id="registration" className="py-24 relative overflow-hidden bg-slate-100/40">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-cyan-400/10 rounded-full blur-[150px] pointer-events-none" />

      {IS_REGISTRATION_CLOSED ? (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="glass-card rounded-3xl p-8 sm:p-14 border border-slate-200/90 shadow-xl relative bg-white text-center">
            {/* Visual status icon */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-center justify-center mx-auto mb-6 text-rose-600 shadow-sm">
              <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>

            {/* Closure Heading */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-4">
              REGISTRATIONS CLOSED
            </h2>

            {/* Closure Notice Message */}
            <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed font-normal">
              The registration limit of 130 students has been reached. Registration for the ECO AI Bootcamp is now officially closed. Thank you for your interest!
            </p>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-cyan-700 mb-3 shadow-sm">
            <QrCode className="w-3.5 h-3.5 text-cyan-600" />
            <span>OFFICIAL BOOTCAMP REGISTRATION</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            RESERVE YOUR <span className="neon-text-gradient">SEAT</span>
          </h2>
          <p className="text-sm text-slate-600">
            Secure your spot for the 3-Day Hands-On Bootcamp on GenAI, Vibe Coding & AI Agents.
          </p>
        </div>

        {/* Multi-Step Progress Indicator */}
        <div className="mb-10">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-slate-200 w-full -z-0" />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-500 -z-0"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />

            {steps.map((st) => {
              const isPassed = currentStep > st.num;
              const isCurrent = currentStep === st.num;
              return (
                <div key={st.num} className="flex flex-col items-center relative z-10">
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm border-2 transition-all ${
                      isCurrent
                        ? 'bg-white border-cyan-500 text-cyan-700 shadow-md scale-110'
                        : isPassed
                        ? 'bg-cyan-600 border-cyan-500 text-white font-extrabold'
                        : 'bg-slate-100 border-slate-300 text-slate-400'
                    }`}
                  >
                    {isPassed ? <Check className="w-4 h-4 stroke-[3]" /> : st.num}
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs font-semibold mt-2 hidden sm:block ${
                      isCurrent ? 'text-cyan-700 font-bold' : isPassed ? 'text-slate-700 font-medium' : 'text-slate-400'
                    }`}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Registration Card Form Body */}
        <div className="glass-card rounded-3xl p-6 sm:p-10 border-slate-200 shadow-xl relative bg-white">
          {/* ========================================================= */}
          {/* STEP 1: STUDENT DETAILS */}
          {/* ========================================================= */}
          {currentStep === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-6">
              <div className="border-b border-slate-100 pb-4 mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-700">
                  Step 01 / 05
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  Student & Participant Details
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your credentials. We will verify your email before proceeding to fee calculation.
                </p>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Full Name <span className="text-pink-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm transition-all"
                  />
                </div>
                {step1Errors.fullName && (
                  <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {step1Errors.fullName}
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Enter Your Email ID <span className="text-pink-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (verificationToken) {
                        setVerificationToken('');
                        setVerificationCode('');
                        setEligibilityData(null);
                      }
                    }}
                    placeholder="e.g. student@gmail.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm transition-all"
                  />

                </div>
                {step1Errors.email && (
                  <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {step1Errors.email}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Phone / WhatsApp Number <span className="text-pink-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="10-digit mobile number"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm transition-all"
                  />
                </div>
                {step1Errors.phone && (
                  <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {step1Errors.phone}
                  </p>
                )}
              </div>

              {/* USN & Semester Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Enter Your USN */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    ENTER YOUR USN <span className="text-pink-600">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <input
                      id="student-usn"
                      name="usn"
                      autoComplete="off"
                      type="text"
                      value={formData.usn}
                      onChange={(e) => setFormData({ ...formData, usn: e.target.value.toUpperCase() })}
                      placeholder="e.g. 2AG22EC001"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm transition-all uppercase"
                    />
                  </div>
                  {step1Errors.usn && (
                    <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {step1Errors.usn}
                    </p>
                  )}
                </div>

                {/* Enter Your Semester */}
                <div>
                  <label htmlFor="student-semester" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    ENTER YOUR SEMESTER <span className="text-pink-600">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <input
                      id="student-semester"
                      name="semester"
                      autoComplete="off"
                      type="text"
                      list="semester-options"
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                      placeholder="e.g. 3rd Sem / 5th Sem / 7th Sem"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm transition-all"
                    />
                    <datalist id="semester-options">
                      <option value="1st Semester" />
                      <option value="2nd Semester" />
                      <option value="3rd Semester" />
                      <option value="4th Semester" />
                      <option value="5th Semester" />
                      <option value="6th Semester" />
                      <option value="7th Semester" />
                      <option value="8th Semester" />
                    </datalist>
                  </div>
                  {step1Errors.semester && (
                    <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {step1Errors.semester}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={step1Loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-pink-600 text-white font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {step1Loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Details...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Email Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ========================================================= */}
          {/* STEP 2: EMAIL VERIFICATION */}
          {/* ========================================================= */}
          {currentStep === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="border-b border-slate-100 pb-4 mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-700">
                  Step 02 / 05
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  Email Verification Code
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  We sent a 6-digit verification code to{' '}
                  <strong className="text-cyan-700">{formData.email}</strong>. Please check your inbox (and spam folder) and enter the code below.
                </p>
              </div>


              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Enter 6-Digit Verification Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <ShieldCheck className="w-5 h-5 text-cyan-600" />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6 digits"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-lg font-mono tracking-widest transition-all"
                  />
                </div>

                {verificationError && (
                  <p className="text-xs text-rose-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {verificationError}
                  </p>
                )}
              </div>

              {/* Resend & Cooldown */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500">
                  {cooldown > 0 ? (
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-cyan-600" />
                      Resend available in {cooldown}s
                    </span>
                  ) : (
                    'Didn\'t receive code?'
                  )}
                </span>

                <button
                  type="button"
                  disabled={cooldown > 0 || isSendingCode}
                  onClick={handleResendOtp}
                  className="font-bold text-cyan-600 hover:text-cyan-700 disabled:opacity-40 transition-colors"
                >
                  {isSendingCode ? 'Sending...' : 'Resend Code'}
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="w-1/3 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={isVerifying || verificationCode.length !== 6}
                  className="w-2/3 py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ========================================================= */}
          {/* STEP 3: PAYMENT QR CODE */}
          {/* ========================================================= */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4 mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-700">
                  Step 03 / 05
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  Official Payment QR Code
                </h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center flex-wrap gap-2">
                  <span>Verified Email: <strong className="text-cyan-700">{formData.email}</strong></span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Check className="w-3 h-3 text-emerald-600 stroke-[3]" /> Verified via OTP
                  </span>
                </p>
              </div>

              {/* Student Metadata Card */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs shadow-sm">
                <div>
                  <span className="text-slate-500 block text-[10px]">Student Name</span>
                  <strong className="text-slate-900 truncate block">{formData.fullName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">USN</span>
                  <strong className="text-indigo-700 font-mono block">{formData.usn || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Semester</span>
                  <strong className="text-slate-900 block">{formData.semester || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Verified Email</span>
                  <strong className="text-cyan-700 truncate block">{formData.email}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Registration ID</span>
                  <strong className="text-indigo-700 font-mono block">{tempRegId}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Bootcamp Fee</span>
                  <strong className="text-emerald-700 font-mono text-sm block">
                    ₹200
                  </strong>
                </div>
              </div>

              {/* QR Image Display */}
              <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-b from-slate-50 via-white to-slate-50 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-extrabold mb-4 shadow-2xs">
                  <span>FLAT REGISTRATION FEE: ₹200</span>
                </div>

                <div className="relative p-1.5 rounded-3xl bg-gradient-to-tr from-cyan-400 via-indigo-500 to-pink-500 shadow-xl shadow-cyan-500/10 mb-4">
                  <div className="p-3 bg-white rounded-[22px] border border-slate-100 max-w-[260px]">
                    <img
                      src={paymentQrImg}
                      alt="Official Payment QR Code"
                      className="w-60 h-60 object-contain rounded-xl"
                    />
                    <div className="text-center mt-2.5 pt-2 border-t border-slate-100">
                      <p className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">
                        Scan with GPay / PhonePe / Paytm / BHIM
                      </p>
                    </div>
                  </div>
                </div>

                <div className="w-full max-w-sm mt-2 p-3 rounded-2xl bg-slate-50 border border-slate-200/90 text-center">
                  <p className="text-xs font-bold text-slate-800 mb-1">
                    Payment Instructions:
                  </p>
                  <ol className="text-[11px] text-slate-600 list-decimal list-inside space-y-1 text-left">
                    <li>Scan this official QR code on any UPI application.</li>
                    <li>Verify receiver name and complete payment of exactly <strong className="text-emerald-700">₹200</strong>.</li>
                    <li>Copy your <strong>12-digit UTR reference number</strong> from the receipt.</li>
                    <li>Click below to submit the UTR for verification.</li>
                  </ol>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="w-1/3 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Back
                </button>

                <button
                  onClick={() => setCurrentStep(4)}
                  className="w-2/3 py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-pink-600 text-white font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <span>I Have Paid — Enter UTR Number</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 4: UTR SUBMISSION */}
          {/* ========================================================= */}
          {currentStep === 4 && (
            <form onSubmit={handleUtrSubmit} className="space-y-6">
              <div className="border-b border-slate-100 pb-4 mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-700">
                  Step 04 / 05
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  Submit Payment Reference (UTR)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enter the 12-digit transaction reference number from your payment receipt.
                </p>
              </div>

              {/* UTR Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Transaction UTR / Reference Number <span className="text-pink-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <FileCheck2 className="w-4 h-4 text-cyan-600" />
                  </div>
                  <input
                    type="text"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value.trim().toUpperCase())}
                    placeholder="e.g. 429184719283"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm font-mono tracking-wider transition-all"
                  />
                </div>
                {utrError && (
                  <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {utrError}
                  </p>
                )}
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Our administrators verify the UTR against official bank statements.
                </p>
              </div>

              {/* Confirmation Checkbox */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={utrConfirmed}
                    onChange={(e) => setUtrConfirmed(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300 bg-white"
                  />
                  <span className="text-xs text-slate-700 leading-relaxed">
                    I confirm that I have transferred ₹200 via UPI using the official QR code and the entered UTR reference is accurate.
                  </span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="w-1/3 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors shadow-sm"
                >
                  View QR Again
                </button>

                <button
                  type="submit"
                  disabled={utrSubmitting || !utrNumber || !utrConfirmed}
                  className="w-2/3 py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-pink-600 text-white font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {utrSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Validating & Recording...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit for Verification</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ========================================================= */}
          {/* STEP 5: CONFIRMATION & PENDING ADMIN VERIFICATION */}
          {/* ========================================================= */}
          {currentStep === 5 && confirmedRegistration && (
            <div className="space-y-6">
              {/* Top Success Badge */}
              <div className="text-center pb-4 border-b border-slate-100">
                <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-md">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900">
                  Registration Submitted for Verification!
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Your seat request and UTR have been recorded successfully.
                </p>
              </div>

              {/* Official Invitation Notice */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-950 flex items-start gap-3 shadow-xs">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-amber-900">
                    Next Step: Administrator Verification & Official Invitation
                  </p>
                  <p className="text-amber-800 leading-relaxed">
                    Once the admin has verified your payment, you will receive an official invitation email at <strong>{confirmedRegistration.email}</strong>:
                    <br />
                    <em>"verification confirmed! we officially invite u for ECO-BOOTCAMP 22nd october to 24 october"</em>
                  </p>
                </div>
              </div>

              {/* Digital Bootcamp Pass / Ticket Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-white via-cyan-50/30 to-white border border-cyan-200 shadow-md relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-700">
                      Official Attendee Pass
                    </span>
                    <h4 className="text-base font-extrabold text-slate-900">
                      FROM PROMPTS TO PRODUCTS — ECO AI-BOOTCAMP 2026
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-extrabold text-cyan-900 bg-cyan-50 px-3 py-1 rounded-lg border border-cyan-200">
                      {confirmedRegistration.registrationId}
                    </span>
                    <button
                      onClick={() => copyToClipboard(confirmedRegistration.registrationId)}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
                      title="Copy ID"
                    >
                      {copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 text-xs mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Student Name</span>
                    <strong className="text-slate-900 block truncate">{confirmedRegistration.fullName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">USN</span>
                    <strong className="text-indigo-700 block font-mono">{confirmedRegistration.usn || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Semester</span>
                    <strong className="text-slate-900 block">{confirmedRegistration.semester || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">College Email</span>
                    <strong className="text-cyan-700 block truncate">{confirmedRegistration.email}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Fee Amount</span>
                    <strong className="text-slate-900 block font-mono">₹{confirmedRegistration.feeAmount}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Submitted UTR</span>
                    <strong className="text-indigo-700 block font-mono">{confirmedRegistration.utrNumber}</strong>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Payment Status:</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 border border-amber-300 text-amber-800 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" />
                      PENDING VERIFICATION
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Registration Status:</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-50 border border-cyan-300 text-cyan-800">
                      SUBMITTED
                    </span>
                  </div>
                </div>
              </div>

              {/* Next Steps Guidance */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2 shadow-sm">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-600" />
                  What happens next?
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Our department coordinators will verify your UTR against official bank records.</li>
                  <li>Once verified, your payment status will change to <strong className="text-emerald-700 font-bold">APPROVED</strong> and an official invitation email will be dispatched.</li>
                  <li>Bootcamp Dates: <strong>22nd October to 24th October 2026</strong>.</li>
                  <li>Keep your Registration ID (<strong>{confirmedRegistration.registrationId}</strong>) handy for check-in.</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={restartFlow}
                  className="w-full py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold transition-colors shadow-sm"
                >
                  Register Another Student
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </section>
  );
};
