import { Provider } from "../_types/provider.types"

export default function useAuth(){
    function initAuth(provider: Provider, redirect?: string)
    {
        const authUrl = new URL(`/api/auth/login/${provider}`, window.location.origin);
        if(redirect)
        {
            authUrl.searchParams.append('redirect', redirect)
        }
        window.location.assign(authUrl.toString());

    }
    return { initAuth }
}