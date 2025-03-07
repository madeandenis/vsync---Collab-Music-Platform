export function isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
}

export function splitUrl(url: string) {
  const parsedUrl = new URL(url, window.location.origin); 
  const domain = parsedUrl.hostname;
  const path = parsedUrl.pathname;
  return { domain, path };
}