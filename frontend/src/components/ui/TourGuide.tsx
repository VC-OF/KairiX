import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { seedPremiumDemoData } from '../../utils/seeder';
import { 
  Sparkles, 
  Users, 
  Palette, 
  Layers, 
  GitFork, 
  ArrowRight, 
  ArrowLeft, 
  X,
  Database,
  HelpCircle
} from 'lucide-react';

const colorMap: Record<string, { border: string; bg: string; glow: string; text: string }> = {
  indigo: { border: 'border-indigo-500', bg: 'bg-indigo-600 dark:bg-indigo-500', glow: 'rgba(99, 102, 241, 0.65)', text: 'text-indigo-500' },
  emerald: { border: 'border-emerald-500', bg: 'bg-emerald-600 dark:bg-emerald-500', glow: 'rgba(16, 185, 129, 0.65)', text: 'text-emerald-500' },
  amber: { border: 'border-amber-500', bg: 'bg-amber-600 dark:bg-amber-500', glow: 'rgba(245, 158, 11, 0.65)', text: 'text-amber-500' },
  pink: { border: 'border-pink-500', bg: 'bg-pink-600 dark:bg-pink-500', glow: 'rgba(236, 72, 153, 0.65)', text: 'text-pink-500' },
  violet: { border: 'border-violet-500', bg: 'bg-violet-600 dark:bg-violet-500', glow: 'rgba(139, 92, 246, 0.65)', text: 'text-violet-500' },
  teal: { border: 'border-teal-500', bg: 'bg-teal-600 dark:bg-teal-500', glow: 'rgba(20, 184, 166, 0.65)', text: 'text-teal-500' },
};

export const TourGuide: React.FC = () => {
  const store = useStore();
  const { 
    isTourActive, 
    setIsTourActive, 
    tourStep, 
    setTourStep, 
    setActiveView, 
    tasks, 
    setSelectedTaskId 
  } = store;

  const [isSeeding, setIsSeeding] = useState(false);
  const [seedingProgress, setSeedingProgress] = useState(0);
  
  // Track target element dimensions for spotlight placement
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const tourSteps = [
    {
      title: 'Welcome to KairiX Enterprise',
      description: 'KairiX is a next-gen collaborative workspace tailored for high-end SaaS projects. Let’s take a 1-minute interactive visual tour to see how you can wow your clients.',
      icon: <Sparkles className="w-8 h-8 text-indigo-500 animate-pulse-glow" />,
      actionText: 'Start Tour',
      action: () => setTourStep(1),
      color: 'indigo',
      targetId: null,
    },
    {
      title: 'Instant Premium Demo Data',
      description: 'Don’t start with a blank slate! Click the button below to seed a fully populated workspace containing realistic tasks, tracked time logs, and a complex dependency chart.',
      icon: <Database className="w-8 h-8 text-emerald-500 animate-bounce-subtle" />,
      actionText: 'Seed Demo Data Now',
      action: async () => {
        setIsSeeding(true);
        setSeedingProgress(0);
        const interval = setInterval(() => {
          setSeedingProgress((p) => {
            if (p >= 100) {
              clearInterval(interval);
              setTimeout(async () => {
                await seedPremiumDemoData(store);
                setIsSeeding(false);
                setTourStep(2);
              }, 200);
              return 100;
            }
            return p + 10;
          });
        }, 120);
      },
      secondaryActionText: 'Next Step',
      secondaryAction: () => setTourStep(2),
      color: 'emerald',
      targetId: null,
    },
    {
      title: 'Live Multiplayer Presence',
      description: 'See team members active in real-time! The Header shows active collaborative groups with glowing green status rings. This spotlighted area shows active users in your current session.',
      icon: <Users className="w-8 h-8 text-pink-500 animate-pulse" />,
      actionText: 'Cool, Next',
      action: () => setTourStep(3),
      color: 'pink',
      targetId: 'tour-presence',
    },
    {
      title: 'White-Label Accent Branding',
      description: 'Customize the aesthetic for your clients! You can click the "Edit" button inside the spotlight to open the customize modal and change project color accents globally.',
      icon: <Palette className="w-8 h-8 text-amber-500 rotate-12" />,
      actionText: 'I See It, Next',
      action: () => setTourStep(4),
      color: 'amber',
      targetId: 'tour-edit-project',
    },
    {
      title: 'Fluid Asana-Style Side Sheets',
      description: 'We have automatically opened the side sheet drawer! Look at the typing indicator spotlighted in the drawer: it simulates Jane Smith writing a live update.',
      icon: <Layers className="w-8 h-8 text-teal-500" />,
      actionText: 'Amazing, Next',
      action: () => setTourStep(5),
      color: 'teal',
      targetId: 'tour-task-typing',
    },
    {
      title: 'Visual Dependency Workspace',
      description: 'KairiX maps tasks into a visual dependency chart. Track predictive critical paths, zoom layout grids, drag links, and view bottleneck risk analysis directly on this canvas.',
      icon: <GitFork className="w-8 h-8 text-violet-500 rotate-90" />,
      actionText: 'Explore Map',
      action: () => setTourStep(6),
      color: 'violet',
      targetId: 'tour-dependency-viewport',
    },
    {
      title: 'You’re Ready to Elevate!',
      description: 'You’ve unlocked the high-end SaaS capabilities of KairiX. Seed mock data, adjust accent themes, and open tasks anytime to showcase ultimate executive polish.',
      icon: <Sparkles className="w-8 h-8 text-indigo-500 animate-pulse-glow" />,
      actionText: 'Finish Tour',
      action: () => handleCloseTour(),
      color: 'indigo',
      targetId: null,
    }
  ];

  const current = tourSteps[tourStep];

  const handleCloseTour = () => {
    setIsTourActive(false);
    setTourStep(0);
    setSelectedTaskId(null);
    setActiveView('dashboard');
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (!isTourActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (!isSeeding) {
          current.action();
        }
      } else if (e.key === 'ArrowLeft') {
        if (tourStep > 0 && !isSeeding) {
          setTourStep(tourStep - 1);
        }
      } else if (e.key === 'Escape') {
        handleCloseTour();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTourActive, tourStep, isSeeding, current]);

  // Synchronize view routing & drawer state per step
  useEffect(() => {
    if (!isTourActive) return;

    const syncStateForStep = () => {
      if (tourStep === 0 || tourStep === 1 || tourStep === 2 || tourStep === 3) {
        setActiveView('dashboard');
        setSelectedTaskId(null);
      } else if (tourStep === 4) {
        setActiveView('board');
        // Auto-open first task to demonstrate Side Sheet
        if (tasks.length > 0) {
          setSelectedTaskId(tasks[0].id);
        }
      } else if (tourStep === 5) {
        setActiveView('dependency');
        setSelectedTaskId(null);
      } else if (tourStep === 6) {
        setActiveView('dashboard');
        setSelectedTaskId(null);
      }
    };

    syncStateForStep();
  }, [tourStep, isTourActive, setActiveView, setSelectedTaskId, tasks]);

  // Periodically measure active target element positioning
  useEffect(() => {
    if (!isTourActive || !current?.targetId) {
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      const el = document.getElementById(current.targetId!);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };

    updateRect();
    const interval = setInterval(updateRect, 300);
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [isTourActive, tourStep, current?.targetId]);

  if (!isTourActive || !current) return null;

  const stepColor = colorMap[current.color] || colorMap.indigo;
  const hasTarget = !!targetRect;

  const renderStepIllustration = (stepIdx: number) => {
    switch (stepIdx) {
      case 0:
        return (
          <div className="flex flex-col items-center gap-2 text-center animate-fade-in-slide select-none">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 via-violet-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-xl animate-pulse">
              KX
            </div>
            <span className="text-[10px] uppercase tracking-widest font-black text-indigo-650 dark:text-indigo-400">Enterprise Edition</span>
          </div>
        );
      case 1:
        return isSeeding ? (
          <div className="w-full space-y-3 px-4 animate-fade-in-slide select-none">
            <div className="flex justify-between text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              <span>Generating mock logs & charts...</span>
              <span>{seedingProgress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300" style={{ width: `${seedingProgress}%` }} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 animate-fade-in-slide text-center select-none">
            <Database className="w-10 h-10 text-emerald-500 animate-bounce-subtle" />
            <span className="text-[10px] uppercase tracking-widest font-black text-gray-400">Ready to populate tasks & hours log</span>
          </div>
        );
      case 2:
        return (
          <div className="flex items-center gap-3 animate-fade-in-slide bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-4 py-3 rounded-2xl shadow-sm select-none">
            <div className="flex -space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center border-2 border-white dark:border-gray-900 relative shadow-sm">
                AD <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse" />
              </div>
              <div className="w-8 h-8 rounded-full bg-pink-500 text-white font-bold text-xs flex items-center justify-center border-2 border-white dark:border-gray-900 relative shadow-sm">
                JS <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse" />
              </div>
              <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center border-2 border-white dark:border-gray-900 relative shadow-sm">
                JD <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse" />
              </div>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Live Team Online</span>
              <span className="text-[9px] font-black uppercase text-pink-550 mt-0.5 tracking-wider">Multiplayer Sync active</span>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col items-center gap-3 animate-fade-in-slide select-none">
            <div className="flex gap-2">
              {['bg-indigo-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600', 'bg-teal-600'].map((bg, i) => (
                <div key={i} className={`w-7 h-7 rounded-full ${bg} border-2 ${i === 2 ? 'border-gray-850 dark:border-white ring-2 ring-amber-500 shadow-md scale-110' : 'border-transparent'} flex items-center justify-center`} />
              ))}
            </div>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Global Accent Color Propagation</span>
          </div>
        );
      case 4:
        return (
          <div className="w-full flex items-stretch gap-2.5 h-20 px-4 animate-fade-in-slide select-none">
            <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-2.5 flex flex-col gap-1.5 opacity-60">
              <div className="h-2 w-3/4 bg-gray-200 dark:bg-gray-850 rounded-full" />
              <div className="h-2 w-1/2 bg-gray-200 dark:bg-gray-850 rounded-full" />
              <div className="h-5 w-full bg-gray-100 dark:bg-gray-850 rounded-lg" />
            </div>
            <div className="w-20 bg-teal-50/50 dark:bg-teal-950/45 border-l-2 border-teal-500 rounded-l-2xl p-2.5 flex flex-col gap-1.5 animate-slide-in-right">
              <div className="h-2.5 w-full bg-teal-500/20 rounded-full animate-pulse" />
              <div className="h-2 w-3/4 bg-teal-500/10 rounded-full" />
              <div className="h-2 w-1/2 bg-teal-500/10 rounded-full" />
            </div>
          </div>
        );
      case 5:
        return (
          <div className="flex items-center gap-3 animate-fade-in-slide select-none">
            <div className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm text-[10px] font-extrabold text-gray-700 dark:text-gray-300">
              Task Node A
            </div>
            <div className="w-8 h-[2px] bg-gradient-to-r from-violet-500 to-pink-500 animate-pulse relative">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-pink-500 rounded-full" />
            </div>
            <div className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm text-[10px] font-extrabold text-gray-700 dark:text-gray-300">
              Task Node B
            </div>
          </div>
        );
      default:
        return (
          <div className="relative w-full h-full flex flex-col items-center justify-center min-h-[110px] overflow-hidden">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100/40 dark:border-emerald-900/40 flex items-center justify-center shadow-lg shadow-emerald-500/10 animate-bounce z-10">
              ✓
            </div>
            <span className="text-[9px] uppercase tracking-widest font-black text-emerald-600 dark:text-emerald-400 mt-2 z-10">Enterprise workspace Ready</span>
            
            {/* Confetti Particles */}
            {[...Array(15)].map((_, i) => {
              const left = Math.random() * 80 + 10;
              const delay = Math.random() * 1.5;
              const duration = Math.random() * 1.5 + 2;
              const size = Math.random() * 6 + 4;
              const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-pink-500', 'bg-amber-500', 'bg-teal-500', 'bg-violet-500'];
              const color = colors[Math.floor(Math.random() * colors.length)];
              
              return (
                <div
                  key={i}
                  className={`absolute rounded-full ${color} opacity-75 animate-float-up`}
                  style={{
                    left: `${left}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    bottom: `-10px`,
                    animationDelay: `${delay}s`,
                    animationDuration: `${duration}s`,
                    animationIterationCount: 'infinite',
                  }}
                />
              );
            })}
          </div>
        );
    }
  };

  return (
    <>
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { transform: translateY(-130px) rotate(360deg); opacity: 0; }
        }
        .animate-float-up {
          animation: floatUp linear;
        }
        @keyframes borderGlowPulse {
          0% { box-shadow: 0 0 8px var(--glow-color), inset 0 0 4px var(--glow-color); }
          50% { box-shadow: 0 0 20px var(--glow-color), inset 0 0 10px var(--glow-color); }
          100% { box-shadow: 0 0 8px var(--glow-color), inset 0 0 4px var(--glow-color); }
        }
        .spotlight-glowing-ring {
          animation: borderGlowPulse 2.2s infinite ease-in-out;
        }
      `}</style>

      {/* BACKDROP OVERLAY OVERLAY SYSTEM */}
      {!hasTarget ? (
        // Regular full-screen glassmorphic dim overlay
        <div 
          onClick={() => handleCloseTour()}
          className="fixed inset-0 bg-black/45 backdrop-blur-[2px] z-40 transition-all duration-500 ease-out" 
        />
      ) : (
        // Click-through 4-quadrant backdrop overlay
        <>
          {/* Top Panel */}
          <div 
            className="fixed inset-x-0 top-0 bg-black/45 backdrop-blur-[1.5px] z-40 transition-all duration-300 ease-out"
            style={{ height: targetRect.top }}
          />
          {/* Bottom Panel */}
          <div 
            className="fixed inset-x-0 bg-black/45 backdrop-blur-[1.5px] z-40 transition-all duration-300 ease-out"
            style={{ top: targetRect.bottom, height: `calc(100vh - ${targetRect.bottom}px)` }}
          />
          {/* Left Panel */}
          <div 
            className="fixed left-0 bg-black/45 backdrop-blur-[1.5px] z-40 transition-all duration-300 ease-out"
            style={{ top: targetRect.top, height: targetRect.height, width: targetRect.left }}
          />
          {/* Right Panel */}
          <div 
            className="fixed bg-black/45 backdrop-blur-[1.5px] z-40 transition-all duration-300 ease-out"
            style={{ top: targetRect.top, left: targetRect.right, height: targetRect.height, width: `calc(100vw - ${targetRect.right}px)` }}
          />

          {/* ACTIVE SPOTLIGHT RING */}
          <div 
            className={`fixed z-40 pointer-events-none transition-all duration-300 ease-out rounded-2xl border-2 ${stepColor.border} spotlight-glowing-ring`}
            style={{
              top: targetRect.top - 6,
              left: targetRect.left - 6,
              width: targetRect.width + 12,
              height: targetRect.height + 12,
              '--glow-color': stepColor.glow,
            } as React.CSSProperties}
          >
            {/* Ping Indicator */}
            <div className={`absolute inset-0 rounded-2xl border-2 ${stepColor.border} animate-ping opacity-60`} />
            
            {/* Visual Label Pointer */}
            <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 ${stepColor.bg} text-white text-[9px] font-black uppercase px-2 py-1 rounded-md shadow-lg flex items-center gap-1 animate-bounce-subtle whitespace-nowrap`}>
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              <span>Target Active</span>
            </div>
          </div>
        </>
      )}

      {/* TOUR CARDS — DYNAMIC DOCKING PORTAL */}
      <div 
        className={`transition-all duration-500 ease-out z-50 flex items-center justify-center p-4 ${
          hasTarget 
            ? 'fixed bottom-4 right-4 w-[360px]' 
            : 'fixed inset-0 w-full flex items-center justify-center'
        }`}
      >
        <div className={`glass-panel rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-white/10 p-5 flex flex-col relative text-gray-900 dark:text-gray-100 ${
          hasTarget 
            ? 'w-full animate-slide-in-right bg-white/95 dark:bg-[#0c1018]/95' 
            : 'w-full max-w-md animate-fade-in'
        }`}>
          
          {/* Close Button */}
          <button 
            onClick={() => handleCloseTour()}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-250 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer z-10"
            aria-label="Close tour"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Progress Dots */}
          <div className="flex items-center space-x-1.5 mb-4 select-none">
            {tourSteps.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === tourStep 
                    ? `w-6 ${stepColor.bg}` 
                    : idx < tourStep 
                      ? 'w-2 bg-indigo-305 dark:bg-indigo-900' 
                      : 'w-2 bg-gray-200 dark:bg-gray-800'
                }`}
              />
            ))}
          </div>

          {/* Header Icon + Title */}
          <div className="flex items-start space-x-3.5 mb-3.5">
            <div className={`p-2.5 rounded-2xl flex-shrink-0 border bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100/50 dark:border-indigo-900/30 shadow-sm ${stepColor.text}`}>
              {current.icon}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight">
                {current.title}
              </h3>
              <span className="text-[9px] text-gray-400 font-extrabold block mt-0.5 uppercase tracking-wider">
                Step {tourStep + 1} of {tourSteps.length}
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-gray-500 dark:text-gray-300 leading-relaxed mb-4">
            {current.description}
          </p>

          {/* Hands-On Alert */}
          {hasTarget && (
            <div className={`mb-3.5 px-3 py-1.5 rounded-xl border border-dashed ${stepColor.border} bg-white/50 dark:bg-black/20 flex items-center gap-2`}>
              <HelpCircle className={`w-3.5 h-3.5 ${stepColor.text} shrink-0 animate-pulse`} />
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                You can interact/click directly on the spotlighted area!
              </p>
            </div>
          )}

          {/* Visual Illustration Panel (only shown when not docked to prevent layout clutter) */}
          {!hasTarget && (
            <div className="my-2.5 p-3 bg-gray-50/50 dark:bg-[#090d16]/30 border border-gray-105 dark:border-gray-800 rounded-2xl flex flex-col items-center justify-center min-h-[110px] relative overflow-hidden">
              {renderStepIllustration(tourStep)}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-gray-100 dark:border-gray-800/60 select-none">
            {/* Back button */}
            {tourStep > 0 && !isSeeding ? (
              <button
                onClick={() => setTourStep(tourStep - 1)}
                className="flex items-center space-x-1 text-xs font-bold text-gray-450 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {/* Action buttons */}
            <div className="flex items-center space-x-2">
              {current.secondaryActionText && !isSeeding && (
                <button
                  onClick={current.secondaryAction}
                  className="px-2.5 py-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/80 rounded-lg transition-colors border border-gray-200 dark:border-gray-800 cursor-pointer"
                >
                  {current.secondaryActionText}
                </button>
              )}
              <button
                onClick={current.action}
                disabled={isSeeding}
                className={`flex items-center space-x-1 px-3.5 py-1.5 ${stepColor.bg} hover:brightness-110 active:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-md transition-all duration-150 transform hover:-translate-y-0.5 cursor-pointer`}
              >
                <span>{isSeeding ? 'Seeding Data...' : current.actionText}</span>
                <ArrowRight className="w-3.5 h-3.5 animate-pulse" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};
