"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { FetchError } from '../errors/fetch.error';
import { AppAlert, useAlertContext } from '../contexts/alertContext';

const createQueryClient = (setError: (message: AppAlert) => void) =>
  new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        if (error instanceof FetchError) {
          setError(error);
        } else {
          setError(`Unexpected query error: ${JSON.stringify(error)}`);
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        if (error instanceof FetchError) {
          setError(error);
        } else {
          setError(`Unexpected mutation error: ${JSON.stringify(error)}`);
        }
      },
    }),
  });

export default function RoutesLayout({ children }: { children: ReactNode }) {
  const { setAlert } = useAlertContext(); 

  function setError(message: AppAlert){
    setAlert(message, 'error');
  } 

  return (
    <QueryClientProvider client={createQueryClient(setError)}>
      {children}
    </QueryClientProvider>
  );
}
