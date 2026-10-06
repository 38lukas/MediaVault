'use client';

import { ThemeProvider, CssBaseline } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { Provider } from 'react-redux';
import { makeStore, type AppStore } from './store';
import { useAppDispatch, useAppSelector } from './hooks';
import { setPrimaryColor } from './settingsSlice';
import { createMediaVaultTheme } from './theme';

const PRIMARY_COLOR_STORAGE_KEY = 'media-vault-primary-color';

function isHexColor(value: string): boolean {
  return /^#[\da-f]{6}$/i.test(value);
}

function getContrastColor(hexColor: string): string {
  const channels = [1, 3, 5].map((offset) =>
    Number.parseInt(hexColor.slice(offset, offset + 2), 16) / 255,
  );
  const linearChannels = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  const luminance =
    0.2126 * linearChannels[0] +
    0.7152 * linearChannels[1] +
    0.0722 * linearChannels[2];

  return luminance > 0.179 ? '#0a0a0a' : '#ffffff';
}

function RuntimeThemeProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const primaryColor = useAppSelector((state) => state.settings.primaryColor);
  const [storedColorLoaded, setStoredColorLoaded] = useState(false);
  const primaryContrast = getContrastColor(primaryColor);
  const theme = useMemo(
    () => createMediaVaultTheme(primaryColor, primaryContrast),
    [primaryColor, primaryContrast],
  );

  useEffect(() => {
    try {
      const storedColor = window.localStorage.getItem(PRIMARY_COLOR_STORAGE_KEY);
      if (storedColor && isHexColor(storedColor)) {
        dispatch(setPrimaryColor(storedColor));
      }
    } finally {
      setStoredColorLoaded(true);
    }
  }, [dispatch]);

  useEffect(() => {
    document.documentElement.style.setProperty('--media-vault-primary', primaryColor);
    document.documentElement.style.setProperty(
      '--media-vault-primary-contrast',
      primaryContrast,
    );
    if (storedColorLoaded) {
      window.localStorage.setItem(PRIMARY_COLOR_STORAGE_KEY, primaryColor);
    }
  }, [primaryColor, primaryContrast, storedColorLoaded]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

/** Provides Redux + dark MUI theme to the App Router tree.
 * 
 *  @param children - Page content.
 *  @returns Wrapped children with store and theme context.
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState<AppStore>(() => makeStore());

  return (
    <Provider store={store}>
      <RuntimeThemeProvider>
        {children}
      </RuntimeThemeProvider>
    </Provider>
  );
}
