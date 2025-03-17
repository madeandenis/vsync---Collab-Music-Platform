import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { FetchError } from '../errors/fetch.error';
import { FetchAlert } from '../_components/alerts/FetchAlert';
import Alert, { AlertProps } from '../_components/alerts/Alert';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export type AppAlert  = FetchError | Error | string;
type AlertType = AlertProps['type']; 

interface AlertContextType {
    alerts: { message: AppAlert; type: AlertType }[]; 
    setAlert: (message: AppAlert, type: AlertType, duration?: number) => void; 
    clearAlert: (index: number) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

const handleErrorRedirect = (error: AppAlert, router: AppRouterInstance) => {
    if (error instanceof FetchError && error.status === 401) {
        router.replace('/login');
    }
};

const renderAlert = (
    alert: { message: AppAlert; type: AlertType, duration?: number }, 
    index: number, 
    clearAlert: (index: number) => void
) => {
    const { message, type, duration } = alert;

    if (message instanceof FetchError) {
        return (
            <FetchAlert
                key={index}
                error={message}
                errorPayloadOn={true}
                index={index}
                duration={duration}
                onClose={() => clearAlert(index)}
            />
        );
    }

    const errorMessage = message instanceof Error ? message.message : message;
    return (
        <Alert
            key={index}
            type={type} 
            content={{ title: errorMessage }}
            index={index}
            duration={duration}
            onClose={() => clearAlert(index)}
        />
    );
};

export const AlertProvider = ({ children }: { children: React.ReactNode }) => {
    const [alerts, setAlerts] = useState<{ message: AppAlert; type: AlertType; duration?: number }[]>([]);
    const router = useRouter();

    const setAlert = (message: AppAlert, type: AlertType, duration?: number) => {
        setAlerts((prevAlerts) => [...prevAlerts, { message, type, duration }]);
    };

    const clearAlert = (index: number) => {
        setAlerts((prevAlerts) => prevAlerts.filter((_, i) => i !== index));
    };

    useEffect(() => {
        alerts.forEach(({ message }) => {
            handleErrorRedirect(message, router);
        });
    }, [alerts, router]);

    return (
        <AlertContext.Provider value={{ alerts, setAlert, clearAlert }}>
            {alerts.map((alert, index) => renderAlert(alert, index, clearAlert))}
            {children}
        </AlertContext.Provider>
    );
};

export const useAlertContext = (): AlertContextType => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error("useAlertContext must be used within an AlertProvider");
    }
    return context;
};