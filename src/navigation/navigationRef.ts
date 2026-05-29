import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParams } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParams>();

export function resetToHome() {
  if (navigationRef.isReady()) {
    navigationRef.reset({ index: 0, routes: [{ name: 'Tabs' }] });
  }
}
