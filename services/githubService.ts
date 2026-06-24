import { apiLogger } from './apiLogger';

const repoCache = new Map<string, string>();
const searchCache = new Map<string, string[]>();

export const searchCompanyRepos = async (company: string): Promise<string[]> => {
  if (searchCache.has(company)) {
    return searchCache.get(company)!;
  }
  
  const logId = apiLogger.log('GitHub Search Repositories', { company });
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json'
    };
    
    // Optional: Add a GitHub token if available in the environment to avoid rate limits
    const githubToken = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GITHUB_TOKEN || import.meta.env.GITHUB_TOKEN : undefined;
    if (githubToken) {
      headers['Authorization'] = `token ${githubToken.trim()}`;
    }

    let repos: string[] = [];
    
    // Helper to fetch with proxy fallback
    const fetchWithProxy = async (url: string, options: any) => {
        let lastError = null;
        try {
            const res = await fetch(url, options);
            if (!res.ok && res.status === 403 && !githubToken) {
                lastError = new Error("Rate limit or CORS");
            } else {
                return res;
            }
        } catch (e: any) {
             lastError = e;
             console.warn(`Direct fetch failed for ${url}, trying proxy fallback. Error:`, e.message);
        }
        
        const proxyHeaders = { ...options.headers };
        delete proxyHeaders['Authorization'];
        
        // Proxy 1: CodeTabs
        try {
            const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`;
            const res = await fetch(proxyUrl, { ...options, headers: proxyHeaders });
            if (res.ok) return res;
        } catch(e) {
            console.warn(`CodeTabs proxy failed for ${url}`);
        }

        // Proxy 2: AllOrigins
        try {
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
            const res = await fetch(proxyUrl, { ...options, headers: proxyHeaders });
            if (res.ok) return res;
        } catch(e) {
            console.warn(`AllOrigins proxy failed for ${url}`);
        }
        
        // Proxy 3: thingproxy
        try {
            const proxyUrl = `https://thingproxy.freeboard.io/fetch/${url}`;
            const res = await fetch(proxyUrl, { ...options, headers: proxyHeaders });
            if (res.ok) return res;
        } catch(e) {
            console.warn(`ThingProxy failed for ${url}`);
        }

        return new Response(null, { status: 502, statusText: "All proxies failed" });
    };

    // First try fetching the user or organization's repositories directly
    let res = await fetchWithProxy(`https://api.github.com/orgs/${encodeURIComponent(company)}/repos?sort=updated&per_page=5`, {
      headers
    });
    
    if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
            repos = data.map((item: any) => item.full_name);
        }
    } else {
        // Try user if it wasn't an org
        res = await fetchWithProxy(`https://api.github.com/users/${encodeURIComponent(company)}/repos?sort=updated&per_page=5`, {
          headers
        });
        
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
                repos = data.map((item: any) => item.full_name);
            }
        } else {
            // Fallback to broad search if user/org doesn't exist
            const q = encodeURIComponent(`${company} in:name,description,readme`);
            res = await fetchWithProxy(`https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc&per_page=5`, {
                headers
            });
            
            if (res.ok) {
                const data = await res.json();
                if (data.items) {
                    repos = data.items.map((item: any) => item.full_name);
                }
            } else {
                console.warn('GitHub search API failed or rate limited', res.statusText);
                apiLogger.update(logId, [], `Error ${res.status}: ${res.statusText}`);
                searchCache.set(company, []);
                return [];
            }
        }
    }

    if (repos.length === 0) {
      apiLogger.update(logId, []);
      searchCache.set(company, []);
      return [];
    }

    apiLogger.update(logId, repos);
    searchCache.set(company, repos);
    return repos;
  } catch (error: any) {
    console.error('Error fetching repos:', error);
    apiLogger.update(logId, [], error?.message || String(error));
    searchCache.set(company, []);
    return [];
  }
};

export const fetchRepoContents = async (repoFullName: string): Promise<string> => {
  if (repoCache.has(repoFullName)) {
    return repoCache.get(repoFullName)!;
  }

  const logId = apiLogger.log('GitHub Fetch Repository Readme', { repoFullName });
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json'
    };
    
    const githubToken = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GITHUB_TOKEN || import.meta.env.GITHUB_TOKEN : undefined;
    if (githubToken) {
      headers['Authorization'] = `token ${githubToken.trim()}`;
    }

    const fetchWithProxy = async (url: string, options: any) => {
        let lastError = null;
        try {
            const res = await fetch(url, options);
            if (!res.ok && res.status === 403 && !githubToken) {
                lastError = new Error("Rate limit or CORS");
            } else {
                return res;
            }
        } catch (e: any) {
             lastError = e;
             console.warn(`Direct fetch failed for ${url}, trying proxy fallback. Error:`, e.message);
        }
        
        const proxyHeaders = { ...options.headers };
        delete proxyHeaders['Authorization'];
        
        // Proxy 1: CodeTabs
        try {
            const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`;
            const res = await fetch(proxyUrl, { ...options, headers: proxyHeaders });
            if (res.ok) return res;
        } catch(e) {
            console.warn(`CodeTabs proxy failed for ${url}`);
        }

        // Proxy 2: AllOrigins
        try {
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
            const res = await fetch(proxyUrl, { ...options, headers: proxyHeaders });
            
            // allorigins sometimes returns 200 with HTML if Cloudflare challenge is hit, but we can't easily check without consuming body.
            // If it fails json parsing later, it'll hit the main catch block.
            if (res.ok) return res;
        } catch(e) {
            console.warn(`AllOrigins proxy failed for ${url}`);
        }
        
        // Proxy 3: thingproxy
        try {
            const proxyUrl = `https://thingproxy.freeboard.io/fetch/${url}`;
            const res = await fetch(proxyUrl, { ...options, headers: proxyHeaders });
            if (res.ok) return res;
        } catch(e) {
            console.warn(`ThingProxy failed for ${url}`);
        }

        // Return a failing response rather than throwing, so caller can check res.status
        return new Response(null, { status: 502, statusText: "All proxies failed" });
    };

    // Try RAW exact README.md first since it has native CORS and no rate limits
    try {
        const rawRes = await fetch(`https://raw.githubusercontent.com/${repoFullName}/master/README.md`);
        if (rawRes.ok) {
            const decoded = await rawRes.text();
            apiLogger.update(logId, { length: decoded.length, snippet: decoded.substring(0, 100) + '...' });
            repoCache.set(repoFullName, decoded);
            return decoded;
        }
        const rawResMain = await fetch(`https://raw.githubusercontent.com/${repoFullName}/main/README.md`);
        if (rawResMain.ok) {
            const decoded = await rawResMain.text();
            apiLogger.update(logId, { length: decoded.length, snippet: decoded.substring(0, 100) + '...' });
            repoCache.set(repoFullName, decoded);
            return decoded;
        }
    } catch(e) {
        console.warn('Raw fetch failed', e);
    }

    // Try catching README using API (resolves dynamic names)
    const res = await fetchWithProxy(`https://api.github.com/repos/${repoFullName}/readme`, {
      headers
    });
    if (!res.ok) {
      if (res.status === 403 || res.status === 404) {
        const fallback = `Repository ${repoFullName} context: No README available or rate limited.`;
        apiLogger.update(logId, fallback, `Error ${res.status}`);
        return fallback;
      }
      throw new Error(`Failed to fetch ${repoFullName} readme`);
    }
    const data = await res.json();
    
    // Convert base64
    // Using TextDecoder for robust utf-8 decoding
    const cleanBase64 = data.content.replace(/\s/g, '');
    const binary = atob(cleanBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decoded = new TextDecoder().decode(bytes);
    
    apiLogger.update(logId, { length: decoded.length, snippet: decoded.substring(0, 100) + '...' });
    repoCache.set(repoFullName, decoded);
    return decoded;
  } catch (error: any) {
    console.error(`Error fetching contents for ${repoFullName}:`, error);
    const fallback = `Repository ${repoFullName} context: Error fetching information.`;
    apiLogger.update(logId, fallback, error?.message || String(error));
    repoCache.set(repoFullName, fallback);
    return fallback;
  }
};
