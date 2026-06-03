import React from 'react';
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
  Database
} from 'lucide-react';

export const TourGuide: React.FC = () => {
  const store = useStore();
  const { isTourActive, setIsTourActive, tourStep, setTourStep, setActiveView } = store;

  if (!isTourActive) return null;

  const tourSteps = [
    {
      title: 'Welcome to KairiX Enterprise',
      description: 'KairiX is a next-gen collaborative workspace tailored for high-end SaaS projects. Let’s take a 1-minute visual tour to see how you can wow your clients.',
      icon: <Sparkles className="w-8 h-8 text-indigo-500 animate-pulse-glow" />,
      actionText: 'Start Tour',
      action: () => setTourStep(1),
    },
    {
      title: 'Instant Premium Demo Data',
      description: 'Don’t start with a blank slate! With one click, seed a fully populated workspace containing realistic tasks, logged hours, timelines, dependencies, and analytics.',
      icon: <Database className="w-8 h-8 text-emerald-500 animate-bounce-subtle" />,
      actionText: 'Seed Demo Data Now',
      action: async () => {
        await seedPremiumDemoData(store);
        setActiveView('dashboard');
        setTourStep(2);
      },
      secondaryActionText: 'Next Step',
      secondaryAction: () => {
        setActiveView('dashboard');
        setTourStep(2);
      }
    },
    {
      title: 'Live Multiplayer Presence',
      description: 'See team members active in real-time! The Header shows active collaborative groups with glowing green status rings, and task detail sheets simulate live typing alerts.',
      icon: <Users className="w-8 h-8 text-pink-500 animate-pulse" />,
      actionText: 'Cool, Next',
      action: () => setTourStep(3),
    },
    {
      title: 'White-Label Accent Branding',
      description: 'Customize the aesthetic for your clients! Open the Edit Modal on the Dashboard to select custom accent palettes (Indigo, Emerald, Amber, Rose, Teal) that theme the entire workspace.',
      icon: <Palette className="w-8 h-8 text-amber-500 rotate-12" />,
      actionText: 'Try Branding',
      action: () => {
        setActiveView('dashboard');
        setTourStep(4);
      },
    },
    {
      title: 'Fluid Asana-Style Side Sheets',
      description: 'Double-click or click details on any task to slide out the premium right-hand drawer sheet. It provides detailed logs, estimation metrics, and active co-editor alerts.',
      icon: <Layers className="w-8 h-8 text-teal-500" />,
      actionText: 'View Kanban Board',
      action: () => {
        setActiveView('board');
        setTourStep(5);
      },
    },
    {
      title: 'Visual Dependency Workspace',
      description: 'KairiX maps tasks into a visual dependency workflow chart. Track predictive critical paths, zoom layout grids, drag links, and view bottleneck risk analysis.',
      icon: <GitFork className="w-8 h-8 text-violet-500 rotate-90" />,
      actionText: 'Explore Dependency Map',
      action: () => {
        setActiveView('dependency');
        setTourStep(6);
      },
    },
    {
      title: 'You’re Ready to Elevate!',
      description: 'You’ve unlocked the high-end SaaS capabilities of KairiX. Load demo data anytime, adjust brand colors, or slide open tasks to showcase ultimate executive polish.',
      icon: <Sparkles className="w-8 h-8 text-gradient" />,
      actionText: 'Finish Tour',
      action: () => {
        setIsTourActive(false);
        setTourStep(0);
      },
    }
  ];

  const current = tourSteps[tourStep];
  if (!current) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 transition-all duration-300 animate-fade-in">
      <div className="w-full max-w-md glass-panel rounded-2xl shadow-2xl overflow-hidden border border-white/20 dark:border-white/10 p-6 flex flex-col relative text-gray-900 dark:text-gray-100">
        
        {/* Close Button */}
        <button 
          onClick={() => {
            setIsTourActive(false);
            setTourStep(0);
          }}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          aria-label="Close tour"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress Dots */}
        <div className="flex items-center space-x-1.5 mb-6">
          {tourSteps.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === tourStep 
                  ? 'w-6 bg-indigo-600 dark:bg-indigo-400' 
                  : idx < tourStep 
                    ? 'w-2 bg-indigo-300 dark:bg-indigo-800' 
                    : 'w-2 bg-gray-200 dark:bg-gray-800'
              }`}
            />
          ))}
        </div>

        {/* Header Icon + Title */}
        <div className="flex items-start space-x-4 mb-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl flex-shrink-0 border border-indigo-100/50 dark:border-indigo-900/30">
            {current.icon}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
              {current.title}
            </h3>
            <span className="text-xs text-gray-400 font-medium block mt-1">
              Step {tourStep + 1} of {tourSteps.length}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
          {current.description}
        </p>

        {/* Footer Actions */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-800/60">
          {/* Back button */}
          {tourStep > 0 ? (
            <button
              onClick={() => setTourStep(tourStep - 1)}
              className="flex items-center space-x-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {/* Action button */}
          <div className="flex items-center space-x-2">
            {current.secondaryActionText && (
              <button
                onClick={current.secondaryAction}
                className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/80 rounded-lg transition-colors border border-gray-200 dark:border-gray-800"
              >
                {current.secondaryActionText}
              </button>
            )}
            <button
              onClick={current.action}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all duration-150 transform hover:-translate-y-0.5"
            >
              <span>{current.actionText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
