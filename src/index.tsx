import React, { createContext, forwardRef, useCallback, useContext, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Animated, Image, Platform, Pressable, SafeAreaView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { contrastOn, DEFAULT_BASE_URL, faDigits, fetchSettings, hostCommand, widgetUrl, type HubChatEvent, type HubChatSettings } from './protocol';

export type { HubChatSettings, HubChatEvent } from './protocol';

export type HubChatProps = {
    /** Widget key from the HubChat panel (hc_...). */
    widgetKey: string;
    /** Custom widget host. Leave empty to use https://widget.hubchat.ir. */
    baseUrl?: string;
    /** Show the floating launcher button. Set false to open only via ref / useHubChat(). */
    showLauncher?: boolean;
    /** Extra offset of the launcher from the bottom (e.g. above a tab bar). */
    bottomOffset?: number;
    onEvent?: (event: HubChatEvent) => void;
    onUnreadChange?: (count: number) => void;
};

export type HubChatHandle = { open: () => void; close: () => void; isOpen: () => boolean };

const HubChatContext = createContext<HubChatHandle | null>(null);

/** Access open/close from anywhere under <HubChatProvider>. */
export function useHubChat(): HubChatHandle {
    const handle = useContext(HubChatContext);

    if (!handle) {
        throw new Error('useHubChat must be used inside <HubChatProvider>.');
    }

    return handle;
}

const BRIDGE = `window.HubChatBridge={postMessage:function(m){window.ReactNativeWebView.postMessage(m);}};true;`;

export const HubChat = forwardRef<HubChatHandle, HubChatProps>(function HubChat(
    { widgetKey, baseUrl = DEFAULT_BASE_URL, showLauncher = true, bottomOffset = 0, onEvent, onUnreadChange },
    ref,
) {
    const [settings, setSettings] = useState<HubChatSettings | null>(null);
    const [open, setOpen] = useState(false);
    const [unread, setUnread] = useState(0);
    const [mounted, setMounted] = useState(false);
    const webView = useRef<WebView>(null);
    const openRef = useRef(false);
    const pop = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        let alive = true;

        fetchSettings(baseUrl, widgetKey).then((value) => {
            if (alive && value) {
                setSettings(value);
                Animated.spring(pop, { toValue: 1, useNativeDriver: true, friction: 6 }).start();
            }
        });
        // Preload the page like widget.js does, so unread messages arrive while closed.
        const timer = setTimeout(() => setMounted(true), 2500);

        return () => {
            alive = false;
            clearTimeout(timer);
        };
    }, [baseUrl, widgetKey, pop]);

    const changeUnread = useCallback((count: number) => {
        setUnread(count);
        onUnreadChange?.(count);
    }, [onUnreadChange]);

    const show = useCallback(() => {
        setMounted(true);
        openRef.current = true;
        setOpen(true);
        changeUnread(0);
        webView.current?.injectJavaScript(hostCommand('open'));
    }, [changeUnread]);

    const hide = useCallback(() => {
        openRef.current = false;
        setOpen(false);
        webView.current?.injectJavaScript(hostCommand('closed'));
    }, []);

    const handle = useMemo<HubChatHandle>(() => ({ open: show, close: hide, isOpen: () => openRef.current }), [show, hide]);

    useImperativeHandle(ref, () => handle, [handle]);

    const onMessage = (event: WebViewMessageEvent) => {
        let data: (HubChatEvent & { source?: string }) | null = null;

        try {
            data = JSON.parse(event.nativeEvent.data);
        } catch {
            return;
        }

        if (!data || data.source !== 'hubchat') {
            return;
        }

        if (data.type === 'close') {
            hide();
        }

        if (data.type === 'ready' && openRef.current) {
            webView.current?.injectJavaScript(hostCommand('open'));
        }

        if (data.type === 'unread' && !openRef.current) {
            changeUnread(data.count);
        }

        onEvent?.(data);
    };

    const brand = settings?.color ?? '#2563eb';
    const side: ViewStyle = settings?.position === 'right' ? { right: 20 } : { left: 20 };
    const hasText = !!settings?.launcher_text;

    return (
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
            {mounted && (
                <SafeAreaView pointerEvents={open ? 'auto' : 'none'} style={[StyleSheet.absoluteFill, styles.panel, { opacity: open ? 1 : 0 }]}>
                    <WebView
                        ref={webView}
                        source={{ uri: widgetUrl(baseUrl, widgetKey) }}
                        injectedJavaScriptBeforeContentLoaded={BRIDGE}
                        onMessage={onMessage}
                        javaScriptEnabled
                        domStorageEnabled
                        allowFileAccess
                        mediaPlaybackRequiresUserAction={false}
                        allowsInlineMediaPlayback
                        setSupportMultipleWindows={false}
                        style={styles.webView}
                    />
                </SafeAreaView>
            )}
            {showLauncher && settings && !open && (
                <Animated.View style={[styles.launcherWrap, side, { bottom: 20 + bottomOffset, transform: [{ scale: pop }] }]}>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="گفتگوی آنلاین"
                        onPress={show}
                        style={[styles.launcher, hasText ? styles.launcherWide : styles.launcherRound, { backgroundColor: brand, shadowColor: brand }]}
                    >
                        {settings.launcher_image ? (
                            <Image source={{ uri: settings.launcher_image }} style={hasText ? styles.picSmall : styles.pic} />
                        ) : (
                            <ChatGlyph color={contrastOn(brand)} />
                        )}
                        {hasText && <Text style={[styles.label, { color: contrastOn(brand) }]}>{settings.launcher_text}</Text>}
                    </Pressable>
                    {unread > 0 && (
                        <View style={[styles.badge, settings.position === 'right' ? { left: -4 } : { right: -4 }]}>
                            <Text style={styles.badgeText}>{faDigits(unread > 9 ? '9+' : unread)}</Text>
                        </View>
                    )}
                </Animated.View>
            )}
        </View>
    );
});

/** Chat bubble with three dots, drawn with Views (no SVG dependency). */
function ChatGlyph({ color }: { color: string }) {
    return (
        <View style={[styles.glyph, { borderColor: color }]}>
            {[0, 1, 2].map((dot) => (
                <View key={dot} style={[styles.dot, { backgroundColor: color }]} />
            ))}
        </View>
    );
}

/** Wrap your app to get useHubChat() everywhere and the launcher on every screen. */
export function HubChatProvider({ children, ...props }: HubChatProps & { children: React.ReactNode }) {
    const ref = useRef<HubChatHandle>(null);
    const handle = useMemo<HubChatHandle>(() => ({
        open: () => ref.current?.open(),
        close: () => ref.current?.close(),
        isOpen: () => ref.current?.isOpen() ?? false,
    }), []);

    return (
        <HubChatContext.Provider value={handle}>
            <View style={styles.flex}>
                {children}
                <HubChat ref={ref} {...props} />
            </View>
        </HubChatContext.Provider>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    panel: { backgroundColor: '#f4f6fa', zIndex: 1000, elevation: 1000 },
    webView: { flex: 1, backgroundColor: 'transparent' },
    launcherWrap: { position: 'absolute', zIndex: 999, elevation: 12 },
    launcher: {
        height: 60, minWidth: 60, borderRadius: 999, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
        shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 10, overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
    },
    launcherRound: { width: 60 },
    launcherWide: { paddingHorizontal: 16, gap: 10 },
    label: { fontSize: 15, fontWeight: '700' },
    pic: { width: 60, height: 60, borderRadius: 30 },
    picSmall: { width: 44, height: 44, borderRadius: 22 },
    glyph: { width: 26, height: 22, borderWidth: 2, borderRadius: 11, borderBottomLeftRadius: 3, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 },
    dot: { width: 3.5, height: 3.5, borderRadius: 2 },
    badge: { position: 'absolute', top: -4, minWidth: 22, height: 22, paddingHorizontal: 6, borderRadius: 11, backgroundColor: '#ef4444', borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
});

export default HubChat;
