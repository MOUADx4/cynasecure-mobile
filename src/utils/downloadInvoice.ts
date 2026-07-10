import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { apiBaseUrl } from '../api/apiFetch';

export async function downloadInvoice(paymentId: number, invoiceNumber?: string | null): Promise<void> {
  const url = `${apiBaseUrl}/checkout/invoice/${paymentId}`;
  const filename = `${invoiceNumber ?? `facture-${paymentId}`}.pdf`;
  const localPath = (FileSystem.cacheDirectory ?? '') + filename;

  try {
    // Fetch with session cookies (same native cookie store as apiFetch)
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/pdf' },
    });

    if (response.status === 401) {
      Alert.alert('Erreur', 'Session expirée. Veuillez vous reconnecter.');
      return;
    }
    if (!response.ok) {
      Alert.alert('Erreur', `Impossible de télécharger la facture (${response.status}).`);
      return;
    }

    // Convert to base64 and write to cache directory
    const blob = await response.blob();
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    await FileSystem.writeAsStringAsync(localPath, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Open iOS share sheet (Save to Files, AirDrop, print…)
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(localPath, {
        mimeType: 'application/pdf',
        dialogTitle: filename,
        UTI: 'com.adobe.pdf',
      });
    } else {
      Alert.alert('Téléchargé', `Facture enregistrée : ${filename}`);
    }
  } catch (e: unknown) {
    Alert.alert('Erreur', (e instanceof Error ? e.message : null) ?? 'Impossible de télécharger la facture.');
  }
}
