import { create } from 'zustand';
import type { Pin } from '@/types';

interface PinStore {
  pins: Pin[];
  isPinboardOpen: boolean;
  isLoading: boolean;

  // Actions
  addPin: (pin: Omit<Pin, 'id' | 'created_at'>) => Promise<void>;
  removePin: (pinId: string) => Promise<void>;
  fetchPins: (userId: string) => Promise<void>;
  togglePinboard: () => void;
  openPinboard: () => void;
  closePinboard: () => void;
}

/**
 * Pin Store - Manages pinned content state
 * Uses Zustand for global state management
 */
export const usePinStore = create<PinStore>((set, get) => ({
  pins: [],
  isPinboardOpen: false,
  isLoading: false,

  addPin: async (pinData) => {
    console.log('📌 Store: Adding pin', { pinData });
    set({ isLoading: true });
    try {
      const response = await fetch('/api/pins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pinData),
      });

      console.log('📌 Store: API response status', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('📌 Store: API error', errorData);
        throw new Error('Failed to create pin');
      }

      const newPin: Pin = await response.json();
      console.log('📌 Store: Pin created successfully', newPin);
      set((state) => ({
        pins: [newPin, ...state.pins],
        isLoading: false,
      }));
      console.log('📌 Store: Pin added to state, total pins:', get().pins.length);
    } catch (error) {
      console.error('❌ Store: Error adding pin:', error);
      set({ isLoading: false });
      throw error; // Re-throw so caller knows it failed
    }
  },

  removePin: async (pinId) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`/api/pins/${pinId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete pin');
      }

      set((state) => ({
        pins: state.pins.filter((pin) => pin.id !== pinId),
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error removing pin:', error);
      set({ isLoading: false });
    }
  },

  fetchPins: async (userId) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`/api/pins?userId=${userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch pins');
      }

      const pins: Pin[] = await response.json();
      set({ pins, isLoading: false });
    } catch (error) {
      console.error('Error fetching pins:', error);
      set({ isLoading: false });
    }
  },

  togglePinboard: () => {
    const currentState = get().isPinboardOpen;
    console.log('📌 Store: Toggle pinboard', { from: currentState, to: !currentState });
    set((state) => ({ isPinboardOpen: !state.isPinboardOpen }));
  },

  openPinboard: () => {
    console.log('📌 Store: Open pinboard');
    set({ isPinboardOpen: true });
  },

  closePinboard: () => {
    console.log('📌 Store: Close pinboard');
    set({ isPinboardOpen: false });
  },
}));
