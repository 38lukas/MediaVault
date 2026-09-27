'use client';

import { ThemeProvider, CssBaseline } from '@mui/material';
import { useRef } from 'react';
import { Provider } from 'react-redux';
import { makeStore, type AppStore } from './store';
import { darkTheme } from './theme';

/**
 * Provides Redux + dark MUI theme to the App Router tree.
 * @param children - Page content.
 * @returns Wrapped children with store and theme context.
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | undefined>(undefined);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  return (
    <Provider store={storeRef.current}>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </Provider>
  );
}
