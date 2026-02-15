import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Package,
  ClipboardList,
  UtensilsCrossed,
  Rocket,
  ChevronRight,
  ChevronLeft,
  X,
  Trash2,
} from 'lucide-react';
import api from '../services/api';
import { Logo } from './Logo';

interface GettingStartedModalProps {
  open: boolean;
  onClose: () => void;
}

const steps = [
  {
    icon: Logo,
    iconColor: 'bg-ocean',
    title: 'Welcome to Stock Up & Go!',
    content: [
      'Stock Up & Go! helps you manage your inventory so you always know exactly what you have on hand.',
      'Keep your inventory up to date and generate shopping lists to bring stock levels back to target \u2014 no more guessing what you need before heading to the store.',
      'When it\u2019s time to prepare for a trip, event, or just restock your home, create on-demand provisioning lists with exactly what you need.',
    ],
  },
  {
    icon: Package,
    iconColor: 'bg-teal',
    title: 'Step 1: Your Inventory',
    content: [
      'Your inventory is the foundation of Stock Up & Go! It\u2019s where you track everything you have \u2014 from food and beverages to cleaning supplies and gear.',
      'For each item, set a target quantity so the app knows when you\u2019re running low. You\u2019ll get alerts when items fall below target or are approaching their expiry date.',
      'A well-maintained inventory powers everything else in the app: shopping lists, provisioning, and your dashboard overview.',
    ],
  },
  {
    icon: ClipboardList,
    iconColor: 'bg-amber',
    title: 'Step 2: Provisioning Lists',
    content: [
      'Provisioning lists help you prepare for trips, guests, or routine restocks. You can create them anytime from the Provisioning page.',
      'Top off your inventory by adding restock items \u2014 these are automatically calculated based on what\u2019s below target.',
      'Need something special that\u2019s not in your regular inventory? Add unique items for one-off needs like party supplies or special dietary requests.',
      'Track your purchases as you shop and mark items as bought to keep everything organized.',
    ],
  },
  {
    icon: UtensilsCrossed,
    iconColor: 'bg-purple-500',
    title: 'Step 3: Meal Planning',
    content: [
      'Build a library of your favorite meals with their ingredients. Once saved, you can reuse them across any trip or event.',
      'Create a meal plan by assigning meals to breakfast, lunch, and dinner slots for each day.',
      'When your plan is ready, generate a shopping list with one click \u2014 it checks your inventory and only adds what you\u2019re missing.',
    ],
  },
  {
    icon: Rocket,
    iconColor: 'bg-ocean',
    title: 'You\u2019re All Set!',
    content: [
      'We\u2019ve added some sample inventory items and provisioning lists to help you explore. Feel free to keep, edit, or remove them.',
      'To get started for real, head to your Inventory and add your essentials \u2014 food, beverages, cleaning supplies, gear, and more.',
      'Once your inventory is set up, creating provisioning lists is a breeze!',
    ],
    isFinal: true,
  },
];

const SWIPE_THRESHOLD = 50;

export function GettingStartedModal({ open, onClose }: GettingStartedModalProps) {
  const [step, setStep] = useState(0);
  const [clearing, setClearing] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const current = steps[step];
  const Icon = current.icon;

  if (!open) return null;

  const handleNext = () => {
    if (step < steps.length - 1) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    touchStartX.current = null;
    if (diff > SWIPE_THRESHOLD) handleNext();
    else if (diff < -SWIPE_THRESHOLD) handleBack();
  };

  const handleGoToInventory = () => {
    onClose();
    navigate('/inventory');
  };

  const handleClearSeedData = async () => {
    setClearing(true);
    try {
      await api.post('/auth/clear-seed-data');
      queryClient.invalidateQueries();
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
      <div className="min-h-full flex items-start sm:items-center justify-center p-4 py-8">
        <div
          className="bg-white rounded-xl shadow-xl w-full max-w-lg relative"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Icon */}
          <div className="flex justify-center pt-8 pb-4">
            <div className={`${current.iconColor} rounded-2xl p-4`}>
              <Icon className="h-10 w-10 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-2">
            <h2 className="text-xl font-bold text-center mb-4">{current.title}</h2>
            <div className="space-y-3">
              {current.content.map((paragraph, i) => (
                <p key={i} className="text-sm text-gray-600 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* Clear seed data option on final step */}
          {current.isFinal && (
            <div className="px-6 pt-3">
              <button
                onClick={handleClearSeedData}
                disabled={clearing}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-coral transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {clearing ? 'Removing sample data...' : 'Remove sample data and start fresh'}
              </button>
            </div>
          )}

          {/* Step indicator dots */}
          <div className="flex justify-center gap-2 py-4">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === step ? 'w-6 bg-ocean' : 'w-2 bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="px-6 pb-6 flex items-center justify-between gap-3">
            {step > 0 ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            {current.isFinal ? (
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Explore Dashboard
                </button>
                <button
                  onClick={handleGoToInventory}
                  className="flex items-center gap-2 px-5 py-2 bg-ocean text-white text-sm font-medium rounded-lg hover:bg-ocean/90 transition-colors"
                >
                  Go to Inventory
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-5 py-2 bg-ocean text-white text-sm font-medium rounded-lg hover:bg-ocean/90 transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
