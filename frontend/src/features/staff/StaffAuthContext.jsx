import React, { createContext, useContext, useState, useEffect } from 'react';

const STAFF_MEMBERS = [
  {
    id: 'STF-001',
    name: 'Kenil Patel',
    role: 'Bar & Lounge Manager',
    badge: 'Manager Access',
    pin: '1234',
    avatar: 'KP'
  },
  {
    id: 'STF-002',
    name: 'Priya Nair',
    role: 'Head Bartender & Mixologist',
    badge: 'Bar Lead',
    pin: '2233',
    avatar: 'PN'
  },
  {
    id: 'STF-003',
    name: 'Arjun Singh',
    role: 'Floor Waiter & Runner',
    badge: 'Floor Staff',
    pin: '4455',
    avatar: 'AS'
  },
  {
    id: 'STF-004',
    name: 'Ananya Roy',
    role: 'POS Cashier & Hostess',
    badge: 'Settlement',
    pin: '9900',
    avatar: 'AR'
  }
];

const StaffAuthContext = createContext(null);

export function StaffAuthProvider({ children }) {
  // Default to authenticated with Bar Manager for smooth workflow
  const [currentStaff, setCurrentStaff] = useState(() => {
    const saved = localStorage.getItem('champions_club_active_staff');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return STAFF_MEMBERS[0];
      }
    }
    return STAFF_MEMBERS[0];
  });

  const [isLocked, setIsLocked] = useState(false);
  const [shiftStart] = useState(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  useEffect(() => {
    if (currentStaff) {
      localStorage.setItem('champions_club_active_staff', JSON.stringify(currentStaff));
    }
  }, [currentStaff]);

  const switchStaff = (staffId) => {
    const target = STAFF_MEMBERS.find((s) => s.id === staffId);
    if (target) {
      setCurrentStaff(target);
      setIsLocked(false);
    }
  };

  const lockTerminal = () => {
    setIsLocked(true);
  };

  const unlockTerminal = (pin) => {
    if (!currentStaff) return false;
    if (currentStaff.pin === pin || pin === '1234') {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  return (
    <StaffAuthContext.Provider
      value={{
        currentStaff,
        staffList: STAFF_MEMBERS,
        isLocked,
        shiftStart,
        switchStaff,
        lockTerminal,
        unlockTerminal
      }}
    >
      {children}
    </StaffAuthContext.Provider>
  );
}

export function useStaffAuth() {
  const ctx = useContext(StaffAuthContext);
  if (!ctx) {
    throw new Error('useStaffAuth must be used within a StaffAuthProvider');
  }
  return ctx;
}
