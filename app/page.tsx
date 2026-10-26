'use client';

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Radio,
  HelpCircle,
  Copy,
  Check,
  AlertTriangle,
  Info,
  Car,
  Wrench,
  Cpu,
  ExternalLink,
  Sparkles,
  Lock,
} from 'lucide-react';
import { getAllDecoders, RadioDecoder, DecodeResult } from '@/lib/decoders';

export default function HomePage() {
  const decoders = useMemo(() => getAllDecoders(), []);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('renault');
  const [serialInput, setSerialInput] = useState<string>('T123');
  const [confirmedOwnership, setConfirmedOwnership] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<DecodeResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);

  const currentDecoder = useMemo(
    () => decoders.find(d => d.brandId === selectedBrandId) || decoders[0],
    [decoders, selectedBrandId]
  );

  // Live client-side validation
  const validation = useMemo(() => {
    if (!serialInput.trim()) {
      return { valid: false, error: 'Introduceti seria radioului.' };
    }
    return currentDecoder.validate(serialInput);
  }, [currentDecoder, serialInput]);

  const handleBrandChange = (brandId: string) => {
    setSelectedBrandId(brandId);
    const newDecoder = decoders.find(d => d.brandId === brandId);
    if (newDecoder && newDecoder.exampleSerials.length > 0) {
      setSerialInput(newDecoder.exampleSerials[0]);
    } else {
      setSerialInput('');
    }
    setResult(null);
    setApiError(null);
  };

  const handleDecodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validation.valid || !confirmedOwnership) return;

    setLoading(true);
    setApiError(null);
    setResult(null);

    try {
      const res = await fetch('/api/decode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: selectedBrandId,
          serial: serialInput,
          confirmedOwnership,
        }),
      });

      const data = await res.json();
      if (!res.ok && res.status !== 400 && res.status !== 200) {
        setApiError(data.error || 'A aparut o eroare la comunicarea cu serverul.');
      } else {
        setResult(data);
        if (!data.ok && data.error && !data.technicalNote) {
          setApiError(data.error);
        }
      }
    } catch {
      setApiError('Eroare de conexiune la server.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getMethodBadge = (decoder: RadioDecoder) => {
    switch (decoder.method) {
      case 'algorithmic':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Cpu className="w-3 h-3" /> Algoritmic Offline
          </span>
        );
      case 'challenge_response':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <KeyRound className="w-3 h-3" /> Challenge-Response
          </span>
        );
      case 'vin_locked':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldCheck className="w-3 h-3" /> CAN-Bus Anti-Theft
          </span>
        );
      case 'lookup':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Lock className="w-3 h-3" /> Baza Date / EEPROM
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Background radial glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950" />

      {/* Navigation header */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white">AnyRadio</span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono">
                  OEM Security Forge
                </span>
              </div>
              <p className="text-xs text-slate-400">Recuperare cod antifurt dupa deconectarea bateriei</p>
            </div>
          </div>

          <button
            onClick={() => setShowHelp(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-blue-400" />
            <span>Ghid Serie Radio</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8 flex-1 w-full">
        {/* Intro Banner */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3">
            Recuperare Cod Radio Auto <span className="text-blue-500">OEM</span>
          </h1>
          <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto">
            Algoritmi matematici reversati si protocoale de securitate OEM (Renault, Ford Seria M, Toyota ERC).
            Fara estimari false: daca o marca necesita server dealer sau dump EEPROM, raportam direct realitatea tehnica.
          </p>
        </div>

        {/* 1. Brand Selection Grid */}
        <div className="mb-8">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            1. Selecteaza Marca Vehiculului
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {decoders.map(decoder => {
              const isSelected = decoder.brandId === selectedBrandId;
              return (
                <button
                  key={decoder.brandId}
                  onClick={() => handleBrandChange(decoder.brandId)}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-500 text-white shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/50'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Car className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                    {decoder.method === 'algorithmic' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" title="100% Algoritmic" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-sm leading-tight text-slate-100">{decoder.brandName}</div>
                    <div className="text-[10px] text-slate-400 mt-1 capitalize">{decoder.method.replace('_', ' ')}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Main Decoder Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>{currentDecoder.brandName}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Modele: {currentDecoder.supportedModels.slice(0, 3).join(', ')}...
                </p>
              </div>
              {getMethodBadge(currentDecoder)}
            </div>

            <form onSubmit={handleDecodeSubmit} className="space-y-5">
              {/* Serial input with live validation */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="serial-input" className="text-xs font-semibold text-slate-300">
                    Seria radioului / Pre-codul
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowHelp(true)}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    Unde gasesc seria?
                  </button>
                </div>

                <div className="relative">
                  <input
                    id="serial-input"
                    type="text"
                    value={serialInput}
                    onChange={e => setSerialInput(e.target.value)}
                    placeholder={currentDecoder.placeholder}
                    className={`w-full px-4 py-3 rounded-xl bg-slate-950 font-mono text-base tracking-wider uppercase border focus:outline-none transition-all ${
                      serialInput.trim()
                        ? validation.valid
                          ? 'border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/30 text-emerald-400'
                          : 'border-rose-500/80 focus:ring-2 focus:ring-rose-500/30 text-rose-400'
                        : 'border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white'
                    }`}
                  />
                  <div className="absolute right-3 top-3.5 flex items-center">
                    {serialInput.trim() && (
                      validation.valid ? (
                        <Check className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-rose-400" />
                      )
                    )}
                  </div>
                </div>

                {/* Validation status text */}
                <div className="mt-2 text-xs">
                  {serialInput.trim() && !validation.valid && (
                    <span className="text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {validation.error}
                    </span>
                  )}
                  {serialInput.trim() && validation.valid && (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Format valid detectat {validation.normalized ? `(${validation.normalized})` : ''}
                    </span>
                  )}
                </div>

                {/* Quick example serial pills */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-500">Exemple rapide:</span>
                  {currentDecoder.exampleSerials.map(example => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => setSerialInput(example)}
                      className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all cursor-pointer"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ownership Confirmation Checkbox & Disclaimer */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmedOwnership}
                    onChange={e => setConfirmedOwnership(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-950 cursor-pointer"
                  />
                  <span className="text-xs text-slate-300 leading-relaxed">
                    Confirm pe propria raspundere ca sunt proprietarul legitim al autovehiculului sau al radioului si
                    solicit recuperarea codului din cauza deconectarii bateriei.
                  </span>
                </label>
                <div className="text-[10px] text-slate-500 flex items-center gap-1 pl-6">
                  <ShieldCheck className="w-3 h-3 text-slate-400" />
                  Instrument destinat exclusiv posesorilor legali de autovehicule. Nu furnizam asistenta pentru unitati raportate furate.
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !validation.valid || !confirmedOwnership}
                className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                  loading || !validation.valid || !confirmedOwnership
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/40'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/25 hover:shadow-blue-600/40'
                }`}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Se proceseaza algoritmul...</span>
                  </div>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Calculeaza Codul de Deblocare</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* 3. Result / Diagnostic View */}
          <div className="lg:col-span-5 space-y-4">
            {apiError && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-rose-200">Eroare de Validare</div>
                  <div className="text-xs mt-0.5">{apiError}</div>
                </div>
              </div>
            )}

            {result ? (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
                {/* Result header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Rezultat Decodare
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase ${
                      result.ok
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {result.confidence}
                  </span>
                </div>

                {/* Main Code Box if OK */}
                {result.ok && result.code && (
                  <div className="my-5 text-center">
                    <div className="text-xs text-slate-400 mb-1">Codul PIN de deblocare este:</div>
                    <div className="relative inline-block">
                      <div className="text-4xl md:text-5xl font-mono font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 py-1">
                        {result.code}
                      </div>
                      <div className="absolute -inset-2 bg-emerald-500/10 blur-xl -z-10 rounded-full" />
                    </div>

                    <div className="mt-3">
                      <button
                        onClick={() => handleCopyCode(result.code!)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-semibold">Copiat in Clipboard!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiaza Codul</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Instructions / Diagnostic advice */}
                {result.instructions && (
                  <div className="mt-4 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs">
                    <div className="font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
                      <Wrench className="w-3.5 h-3.5 text-blue-400" />
                      Instructiuni Introducere in Radio:
                    </div>
                    <p className="text-slate-400 whitespace-pre-line leading-relaxed">{result.instructions}</p>
                  </div>
                )}

                {/* Technical Note / Microcode details */}
                {result.technicalNote && (
                  <div className="mt-3 p-3.5 rounded-xl bg-blue-950/20 border border-blue-900/40 text-xs text-blue-200">
                    <div className="font-semibold text-blue-300 flex items-center gap-1.5 mb-1">
                      <Cpu className="w-3.5 h-3.5 text-blue-400" />
                      Nota Tehnica de Inginerie Auto:
                    </div>
                    <p className="text-slate-300 leading-relaxed">{result.technicalNote}</p>
                  </div>
                )}

                {/* If Not OK (e.g. Ford V or Fiat Continental) */}
                {!result.ok && result.error && (
                  <div className="my-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs leading-relaxed space-y-2">
                    <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-amber-400" />
                      Status Sistem OEM:
                    </div>
                    <p>{result.error}</p>
                  </div>
                )}
              </div>
            ) : (
              /* Idle state card */
              <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-6 text-center text-slate-500 flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-slate-600 mb-3">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-slate-400">Asteptare Date Intrare</div>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Selecteaza marca, introdu seria radioului si apasa butonul de calcul pentru a obtine codul PIN.
                </p>
              </div>
            )}

            {/* Quick button shortcut info for active brand */}
            {currentDecoder.helpInstructions.buttonShortcut && (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5 mb-1">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                  Scurtatura taste (fara demontare):
                </div>
                <p className="text-slate-400 leading-relaxed">
                  {currentDecoder.helpInstructions.buttonShortcut}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Guide Modal / Drawer */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <HelpCircle className="w-5 h-5 text-blue-400" />
                <span>Ghid: Unde gasesc seria radioului?</span>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              {/* Method 1: On-screen button shortcuts */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="font-semibold text-white flex items-center gap-2 mb-1.5">
                  <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-mono font-bold">
                    1
                  </span>
                  Metoda combinatiilor de taste (Pe ecran, fara demontare)
                </div>
                <ul className="text-xs text-slate-400 space-y-1.5 pl-8 list-disc">
                  <li>
                    <strong className="text-slate-200">Ford:</strong> Tineti apasate tastele <strong>1 si 6</strong> (sau 2 si 6) timp de 3 secunde la pornirea radioului. Seria M sau V va rula pe ecran.
                  </li>
                  <li>
                    <strong className="text-slate-200">Renault / Dacia:</strong> Tineti apasate tastele <strong>1 si 6</strong> simultan. Pre-codul de 4 caractere (ex: T123) va fi afisat pe afisaj.
                  </li>
                  <li>
                    <strong className="text-slate-200">Toyota:</strong> Tineti apasat butonul <strong>MENU</strong> si aprindeti/stingeti farurile de 3 ori pentru a accesa meniul secret de service si codul ERC de 16 caractere.
                  </li>
                </ul>
              </div>

              {/* Method 2: Radio Removal */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="font-semibold text-white flex items-center gap-2 mb-1.5">
                  <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-mono font-bold">
                    2
                  </span>
                  Metoda etichetei fizice (Demontarea din bord)
                </div>
                <p className="text-xs text-slate-400 pl-8 leading-relaxed mb-2">
                  Daca combinatiile de taste nu functioneaza, glisati radioul afara din bord folosind cheile corespunzatoare:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8 text-xs">
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <strong className="text-slate-200">Tije U (Renault / Fiat / Opel):</strong> Doua tije introduse in orificiile din partile laterale.
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <strong className="text-slate-200">Chei plate PC5-132 (Ford):</strong> 4 chei plate introduse in cele 4 fante de la colturi.
                  </div>
                </div>
              </div>

              {/* Specific for current selected brand */}
              <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-900/50">
                <div className="font-semibold text-blue-200 mb-1">
                  Ghid specific pentru {currentDecoder.brandName}:
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-1">
                  <strong>Locatie eticheta:</strong> {currentDecoder.helpInstructions.labelLocation}
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {currentDecoder.helpInstructions.removalGuide}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowHelp(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all cursor-pointer"
              >
                Am inteles
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950 py-6 mt-12 text-xs text-slate-500 text-center">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>AnyRadio OEM Security &bull; Construit pentru inginerie auto & proprietari legitimi</span>
          </div>
          <div>
            Next.js App Router &bull; TypeScript Strict &bull; Vitest Tested &bull; Tailwind CSS
          </div>
        </div>
      </footer>
    </div>
  );
}
