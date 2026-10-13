/**
 * DLAND TANK ARENA - Mobile Haptic Feedback Engine
 * Lightweight, safe vibration helpers for mobile touch events
 */

export const haptics = {
  /** Light tap for UI clicks, joystick movement, mode selection */
  light: () => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(10);
      } catch {
        // Ignore devices that block vibration
      }
    }
  },

  /** Medium tap for shooting, skill activations, button presses */
  medium: () => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(22);
      } catch {}
    }
  },

  /** Heavy vibration for taking damage, explosions, tank destruction */
  heavy: () => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate([35, 25, 45]);
      } catch {}
    }
  },

  /** Celebration pattern for kill streaks, level up, and medals */
  celebrate: () => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate([30, 20, 50, 30, 80]);
      } catch {}
    }
  },
};
