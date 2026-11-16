# hubchat-react-native

ویجت چت پشتیبانی هاب‌چت برای اپ‌های React Native (iOS و اندروید)، با همان ظاهر و امکانات ویجت سایت.

## امکانات
- دکمه‌ی شناور با رنگ، آیکن، متن و جایگاهی که در پنل هاب‌چت تنظیم کرده‌اید
- پنل گفتگو با همان ظاهر و امکانات ویجت سایت: ارسال فایل و عکس، پایگاه دانش، ساعات کاری و نظرسنجی رضایت
- شمارنده‌ی پیام‌های خوانده‌نشده روی دکمه، حتی وقتی پنل بسته است
- تغییر ظاهر از پنل، بدون نیاز به انتشار نسخه‌ی جدید اپ
- پیام‌های کاربران در صندوق ورودی هاب‌چت، کنار تلگرام، بله، روبیکا و بقیه‌ی کانال‌ها

## کلید کانال
کلید را از پنل هاب‌چت بگیرید: «تنظیمات > کانال‌ها > افزودن کانال > اپلیکیشن موبایل». کلید با `hc_` شروع می‌شود و در صفحه‌ی همان کانال، کنار نمونه‌کد نصب، نمایش داده می‌شود.

## نصب
```bash
npm install hubchat-react-native react-native-webview
cd ios && pod install
```

## استفاده
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


### صفحه‌ی فعلی کاربر

اپراتور کنار گفتگو می‌بیند کاربر الان در کدام صفحه‌ی اپ است:

```tsx
const hubChat = useHubChat();
hubChat.setScreen('checkout', 'تکمیل خرید');
```

### معرفی کاربر لاگین‌کرده

```tsx
hubChat.identify({
  user_id: user.id,
  name: user.fullName,
  mobile: user.mobile,
  custom: { plan: 'VIP' },
  signature: signatureFromYourServer, // HMAC-SHA256 شناسه با کلید مخفی، روی سرور
});

hubChat.logout(); // هنگام خروج از حساب
```

همه‌ی فیلدها و روش ساخت امضا: https://hubchat.ir/docs/widget-identify

## ویژگی‌ها (props)
| prop | توضیح |
|---|---|
| `widgetKey` | کلید ویجت از پنل (`hc_...`) |
| `showLauncher` | نمایش دکمه‌ی شناور (پیش‌فرض `true`) |
| `bottomOffset` | فاصله‌ی اضافه از پایین (مثلاً بالای تب‌بار) |
| `onUnreadChange` | تعداد پیام‌های خوانده‌نشده |
| `onEvent` | رویدادهای `ready`، `close`، `unread` |

## تنظیمات iOS
برای آپلود فایل در iOS این کلیدها را به `Info.plist` اضافه کنید: `NSCameraUsageDescription`، `NSPhotoLibraryUsageDescription`، `NSMicrophoneUsageDescription`.

## پشتیبانی
- مستندات: https://hubchat.ir/docs/connect-channel/mobile_sdk
- گزارش مشکل: بخش Issues همین مخزن
- وب‌سایت: https://hubchat.ir
