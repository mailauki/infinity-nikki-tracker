'use client'

import { SnackbarProvider } from 'notistack';
import { ReactNode } from 'react';

export default function SnackbarAlertProvider({ children }: { children: ReactNode }) {
  return (
    <SnackbarProvider anchorOrigin={{ vertical: 'top', horizontal: 'left' }} autoHideDuration={6000}
        maxSnack={3}>
      {children}
    </SnackbarProvider>
  );
}