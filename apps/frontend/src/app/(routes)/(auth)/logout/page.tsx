'use client';

import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { fetchApi } from '../../../_utils/fetchUtils';
import { useAlertContext } from '../../../contexts/alertContext';
import LoadingOverlay from '../../../_components/LoadingOverlay';

export default function LogoutPage() {
    const { setAlert } = useAlertContext();
    
    const logoutMutation = useMutation({
        mutationFn: () => fetchApi<unknown>('/api/auth/logout', { method: 'POST' }),
        onSuccess: () => {
            window.location.assign('/home'); 
        },
        onError: (error) => {
            setAlert(error, 'error');
            window.history.back();
        },
    });
    
    useEffect(() => {
        logoutMutation.mutate();
    }, []);
  
    return (
        <div className="w-screen h-screen bg-ytMusicBlack subtle-colorful-bg">
            <LoadingOverlay message="Logging out..." opacity={0.9}/>
        </div>
    );
}

