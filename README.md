# hubchat-react-native

ویجت چت پشتیبانی هاب‌چت برای اپ‌های React Native (iOS و اندروید)، با همان ظاهر و امکانات ویجت سایت.

```bash
npm install hubchat-react-native react-native-webview
cd ios && pod install
```

```tsx
import { HubChatProvider, useHubChat } from 'hubchat-react-native';

export default function App() {
  return (
    <HubChatProvider widgetKey="hc_xxxxxxxxxxxxxxxxxxxxxxxx" bottomOffset={56}>
      <RootNavigator />
    </HubChatProvider>
  );
}

function SupportButton() {
  const chat = useHubChat();
  return <Button title="پشتیبانی" onPress={chat.open} />;
}
```

| prop | توضیح |
|---|---|
| `widgetKey` | کلید ویجت از پنل (`hc_...`) |
| `showLauncher` | نمایش دکمه‌ی شناور (پیش‌فرض `true`) |
| `bottomOffset` | فاصله‌ی اضافه از پایین (مثلاً بالای تب‌بار) |
| `onUnreadChange` | تعداد پیام‌های خوانده‌نشده |
| `onEvent` | رویدادهای `ready`، `close`، `unread` |

برای آپلود فایل در iOS این کلیدها را به `Info.plist` اضافه کنید: `NSCameraUsageDescription`، `NSPhotoLibraryUsageDescription`، `NSMicrophoneUsageDescription`.

## نحوه‌ی کار
تنظیمات دکمه از `GET https://widget.hubchat.ir/widget/{key}/config` خوانده و دکمه‌ی شناور به‌صورت نیتیو ساخته می‌شود. خود صفحه‌ی ویجت (`/widget/{key}`)، همان صفحه‌ای که روی سایت در iframe باز می‌شود، در WebView بارگذاری می‌شود؛ پس ظاهر و امکانات پنل دقیقاً مثل سایت است. SDK پیش از بارگذاری صفحه `window.HubChatBridge.postMessage` را تعریف می‌کند و ویجت رویدادهای `ready`، `close` و `unread` را از آن می‌فرستد.
