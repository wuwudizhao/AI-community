'use client';

import { createContext, useContext } from 'react';

type FeatureFlags = {
  allowGuestPosting: boolean;
};

const FeatureFlagsContext = createContext<FeatureFlags>({ allowGuestPosting: false });

export function FeatureFlagsProvider({
  allowGuestPosting,
  children,
}: FeatureFlags & { children: React.ReactNode }) {
  return (
    <FeatureFlagsContext.Provider value={{ allowGuestPosting }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  return useContext(FeatureFlagsContext);
}
