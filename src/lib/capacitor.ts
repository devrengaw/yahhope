import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App as CapApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'
export const isIOS = platform === 'ios';
export const isAndroid = platform === 'android';

/**
 * Initializes native mobile configuration (Status bar, splash screen, back button, etc.)
 */
export async function initializeNativeApp(onBackButton?: () => void) {
  if (!isNative) return;

  try {
    // Configure Status Bar style
    await StatusBar.setStyle({ style: Style.Dark });
    if (isAndroid) {
      await StatusBar.setBackgroundColor({ color: '#FFFFFF' });
    }
  } catch (err) {
    console.warn('Native status bar initialization error:', err);
  }

  try {
    // Smoothly hide splash screen when app is ready
    await SplashScreen.hide({ fadeOutDuration: 350 });
  } catch (err) {
    // SplashScreen may not be active on web or already hidden
  }

  // Handle Android Hardware Back Button
  if (isAndroid) {
    CapApp.addListener('backButton', ({ canGoBack }) => {
      if (onBackButton) {
        onBackButton();
      } else if (canGoBack) {
        window.history.back();
      } else {
        CapApp.exitApp();
      }
    });
  }
}

