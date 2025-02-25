export function getCookieValue(cookieName: string, cookies: string[])
{
    for(const cookie of cookies){
        if(cookie.startsWith(cookieName)){
            const [name, value] = cookie.split('=');
            return decodeURIComponent(value);
        }
    }
    return undefined;
}

export function parseSessionCookie(cookieValue: string)
{    
    if (!cookieValue.startsWith('s:')) {
        throw new Error('Invalid session cookie format'); 
    }

    const [sessionID, signature] = cookieValue.slice(2).split('.');
    return  {
        sessionID,
        signature,
    }
}

