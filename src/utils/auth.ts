import { RankTier, getRankFromRp, TankSkinId, BulletTrailId, RoofDecalId, TankClass } from '../types/game';
import { getPlayerStats, savePlayerStats, PlayerRecordStats } from './playerStats';

export interface UserAccount {
  id: string;
  isGuest: boolean;
  email?: string;
  name: string;
  avatarUrl?: string;
  provider: 'guest' | 'google';
  createdAt: number;
  lastLoginAt: number;
  rankRp: number;
  rankTier: RankTier;
  skinId: TankSkinId;
  bulletTrail: BulletTrailId;
  roofDecal: RoofDecalId;
  tankClass: TankClass;
}

const AUTH_USER_KEY = 'tank_auth_current_user';
const CLOUD_ACCOUNTS_KEY = 'tank_cloud_synced_accounts';

// Generate safe unique guest id
const generateGuestId = (): string => {
  return `guest_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
};

// Retrieve mock cloud account registry (persisted in localStorage to simulate remote DB)
const getCloudRegistry = (): Record<string, UserAccount> => {
  try {
    const raw = localStorage.getItem(CLOUD_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn('Failed to parse cloud accounts:', err);
    return {};
  }
};

const saveCloudRegistry = (registry: Record<string, UserAccount>) => {
  try {
    localStorage.setItem(CLOUD_ACCOUNTS_KEY, JSON.stringify(registry));
  } catch (err) {
    console.warn('Failed to save cloud registry:', err);
  }
};

// Get active user or fallback to guest
export const getCurrentUser = (): UserAccount => {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as UserAccount;
      if (parsed && parsed.id) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse current auth user:', err);
  }

  // Create default guest user based on existing localStorage settings
  const localName = localStorage.getItem('tank_player_name') || 'Chiến Binh Guest';
  const localRankRp = Number(localStorage.getItem('tank_player_rank_rp')) || 850;
  const localSkin = (localStorage.getItem('tank_skin') as TankSkinId) || 'DEFAULT';
  const localTrail = (localStorage.getItem('tank_trail') as BulletTrailId) || 'STANDARD';
  const localDecal = (localStorage.getItem('tank_decal') as RoofDecalId) || 'FLAG_VIETNAM';
  const localClass = (localStorage.getItem('tank_class') as TankClass) || 'STRIKER';

  const defaultGuest: UserAccount = {
    id: generateGuestId(),
    isGuest: true,
    name: localName,
    provider: 'guest',
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
    rankRp: localRankRp,
    rankTier: getRankFromRp(localRankRp).tier,
    skinId: localSkin,
    bulletTrail: localTrail,
    roofDecal: localDecal,
    tankClass: localClass,
  };

  saveCurrentUser(defaultGuest);
  return defaultGuest;
};

export const saveCurrentUser = (user: UserAccount): void => {
  try {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    // Keep legacy local keys in sync
    localStorage.setItem('tank_player_name', user.name);
    localStorage.setItem('tank_player_rank_rp', String(user.rankRp));
    localStorage.setItem('tank_skin', user.skinId);
    localStorage.setItem('tank_trail', user.bulletTrail);
    localStorage.setItem('tank_decal', user.roofDecal);
    localStorage.setItem('tank_class', user.tankClass);
  } catch (err) {
    console.warn('Failed to save current user:', err);
  }

  // If Google account, also update cloud registry
  if (!user.isGuest && user.email) {
    const registry = getCloudRegistry();
    registry[user.email] = { ...user, lastLoginAt: Date.now() };
    saveCloudRegistry(registry);
  }
};

// Play as guest immediately
export const loginAsGuest = (guestName?: string): UserAccount => {
  const current = getCurrentUser();
  if (current.isGuest) {
    if (guestName && guestName.trim()) {
      current.name = guestName.trim();
      saveCurrentUser(current);
    }
    return current;
  }

  // Switch from Google to Guest mode
  const newGuest: UserAccount = {
    id: generateGuestId(),
    isGuest: true,
    name: guestName?.trim() || 'Chiến Binh Guest',
    provider: 'guest',
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
    rankRp: 850,
    rankTier: 'GOLD',
    skinId: 'DEFAULT',
    bulletTrail: 'STANDARD',
    roofDecal: 'FLAG_VIETNAM',
    tankClass: 'STRIKER',
  };

  saveCurrentUser(newGuest);
  return newGuest;
};

// Login with Google and optionally sync/merge guest progress
export const loginWithGoogle = (
  googleData: {
    email: string;
    name: string;
    avatarUrl?: string;
  },
  syncGuestData: boolean = true
): { user: UserAccount; synced: boolean } => {
  const currentGuest = getCurrentUser();
  const currentStats = getPlayerStats();
  const registry = getCloudRegistry();
  const existingCloudUser = registry[googleData.email];

  let synced = false;
  let finalUser: UserAccount;

  if (existingCloudUser) {
    // Account exists in cloud. If syncGuestData is true, merge the highest stats and rank!
    if (syncGuestData && currentGuest.isGuest) {
      const mergedRp = Math.max(existingCloudUser.rankRp, currentGuest.rankRp);
      finalUser = {
        ...existingCloudUser,
        name: googleData.name || existingCloudUser.name,
        avatarUrl: googleData.avatarUrl || existingCloudUser.avatarUrl,
        rankRp: mergedRp,
        rankTier: getRankFromRp(mergedRp).tier,
        skinId: currentGuest.skinId !== 'DEFAULT' ? currentGuest.skinId : existingCloudUser.skinId,
        bulletTrail: currentGuest.bulletTrail !== 'STANDARD' ? currentGuest.bulletTrail : existingCloudUser.bulletTrail,
        roofDecal: currentGuest.roofDecal !== 'NONE' ? currentGuest.roofDecal : existingCloudUser.roofDecal,
        lastLoginAt: Date.now(),
      };

      // Merge stats
      const mergedStats: PlayerRecordStats = {
        totalMatches: Math.max(currentStats.totalMatches, 1),
        totalWins: currentStats.totalWins,
        totalLosses: currentStats.totalLosses,
        totalKills: currentStats.totalKills,
        totalDeaths: currentStats.totalDeaths,
        totalScore: currentStats.totalScore,
        highestStreak: currentStats.highestStreak,
        rankedMatches: currentStats.rankedMatches,
        rankedWins: currentStats.rankedWins,
        casualMatches: currentStats.casualMatches,
        casualWins: currentStats.casualWins,
        lastUpdated: Date.now(),
      };
      savePlayerStats(mergedStats);
      synced = true;
    } else {
      finalUser = {
        ...existingCloudUser,
        name: googleData.name || existingCloudUser.name,
        avatarUrl: googleData.avatarUrl || existingCloudUser.avatarUrl,
        lastLoginAt: Date.now(),
      };
    }
  } else {
    // New Google account: Bind existing Guest progress so user doesn't lose anything!
    finalUser = {
      id: `google_${googleData.email.replace(/[^a-zA-Z0-9]/g, '_')}`,
      isGuest: false,
      email: googleData.email,
      name: googleData.name || currentGuest.name,
      avatarUrl:
        googleData.avatarUrl ||
        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(googleData.email)}`,
      provider: 'google',
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      rankRp: currentGuest.rankRp,
      rankTier: currentGuest.rankTier,
      skinId: currentGuest.skinId,
      bulletTrail: currentGuest.bulletTrail,
      roofDecal: currentGuest.roofDecal,
      tankClass: currentGuest.tankClass,
    };
    synced = true;
  }

  saveCurrentUser(finalUser);
  return { user: finalUser, synced };
};

// Manually sync current local stats to Google Cloud
export const syncAccountToCloud = (user: UserAccount): UserAccount => {
  if (user.isGuest || !user.email) return user;

  const currentStats = getPlayerStats();
  const updatedUser: UserAccount = {
    ...user,
    lastLoginAt: Date.now(),
  };

  saveCurrentUser(updatedUser);
  savePlayerStats(currentStats);
  return updatedUser;
};

// Logout back to a guest session
export const logoutToGuest = (): UserAccount => {
  const guest: UserAccount = {
    id: generateGuestId(),
    isGuest: true,
    name: 'Chiến Binh Guest',
    provider: 'guest',
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
    rankRp: 850,
    rankTier: 'GOLD',
    skinId: 'DEFAULT',
    bulletTrail: 'STANDARD',
    roofDecal: 'FLAG_VIETNAM',
    tankClass: 'STRIKER',
  };

  saveCurrentUser(guest);
  return guest;
};

// Update active account player display name across current session & local storage
export const updateUserName = (newName: string): UserAccount => {
  const current = getCurrentUser();
  const trimmed = newName.trim();
  if (trimmed) {
    current.name = trimmed;
    saveCurrentUser(current);
  }
  return current;
};
