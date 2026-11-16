/**
 * Shared protocol with the HubChat widget page (/widget/{key}).
 * The page calls window.HubChatBridge.postMessage(json) for: ready, close, unread.
 * The host opens/closes the panel with window.postMessage({source:'hubchat-loader', type}).
 */
export const DEFAULT_BASE_URL = 'https://widget.hubchat.ir';

export type HubChatSettings = {
    color: string;
    position: 'left' | 'right';
    launcher_text?: string | null;
    launcher_image?: string | null;
    title?: string | null;
    subtitle?: string | null;
};

export type HubChatEvent =
    | { type: 'ready' }
    | { type: 'close' }
    | { type: 'unread'; count: number; preview?: string; agent?: string | null };

export function widgetUrl(baseUrl: string, widgetKey: string): string {
    return `${baseUrl.replace(/\/$/, '')}/widget/${widgetKey}`;
}

export async function fetchSettings(baseUrl: string, widgetKey: string): Promise<HubChatSettings | null> {
    try {
        const response = await fetch(`${widgetUrl(baseUrl, widgetKey)}/config`);
        const data = response.ok ? await response.json() : null;

        return data?.settings ?? null;
    } catch {
        return null;
    }
}

export function hostCommand(type: 'open' | 'closed'): string {
    return `window.postMessage({source:'hubchat-loader',type:'${type}'},'*');true;`;
}

/** Tells the widget which app screen the user is on (JSON-encoded, never string-built). */
export function screenCommand(name: string, title?: string): string | null {
    const path = name.trim().replace(/^\/+/, '');

    if (!path) {
        return null;
    }

    const payload = { source: 'hubchat-loader', type: 'page', url: `app://screen/${encodeURI(path)}`, title: title ?? name };

    return `window.postMessage(${JSON.stringify(payload)},'*');true;`;
}

/** Identifies the logged-in user; see https://hubchat.ir/docs/widget-identify */
export function identifyCommand(user: Record<string, unknown>): string {
    return `window.postMessage(${JSON.stringify({ source: 'hubchat-loader', type: 'identify', user })},'*');true;`;
}

export const logoutCommand = "window.postMessage({source:'hubchat-loader',type:'logout'},'*');true;";

/** Same contrast rule as widget.js so launcher text color matches the website. */
export function contrastOn(hex: string): string {
    const channel = (offset: number) => {
        const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;

        return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    };

    return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5) > 0.45 ? '#0b1220' : '#ffffff';
}

export function faDigits(value: string | number): string {
    return String(value).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);
}
