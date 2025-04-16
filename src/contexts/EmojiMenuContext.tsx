import React, { createContext, useContext, useState, ReactNode } from 'react';

interface EmojiMenuContextType {
  openVibeId: string | null;
  setOpenVibeId: (id: string | null) => void;
}

const EmojiMenuContext = createContext<EmojiMenuContextType | undefined>(undefined);

export function useEmojiMenu() {
  const context = useContext(EmojiMenuContext);
  if (context === undefined) {
    throw new Error('useEmojiMenu must be used within an EmojiMenuProvider');
  }
  return context;
}

interface EmojiMenuProviderProps {
  children: ReactNode;
}

export function EmojiMenuProvider({ children }: EmojiMenuProviderProps) {
  const [openVibeId, setOpenVibeId] = useState<string | null>(null);

  return (
    <EmojiMenuContext.Provider value={{ openVibeId, setOpenVibeId }}>
      {children}
    </EmojiMenuContext.Provider>
  );
}