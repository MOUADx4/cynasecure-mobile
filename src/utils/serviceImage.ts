import { ImageSourcePropType } from 'react-native';
import { apiBaseUrl } from '../api/apiFetch';

const LOCAL_IMAGES: Record<string, ImageSourcePropType> = {
  'cloud.jpg':   require('../assets/cloud.jpg'),
  'data.jpg':    require('../assets/data.jpg'),
  'edr.jpg':     require('../assets/edr.jpg'),
  'iam.jpg':     require('../assets/iam.jpg'),
  'network.jpg': require('../assets/network.jpg'),
  'soc.jpg':     require('../assets/soc.jpg'),
  'support.jpg': require('../assets/support.jpg'),
  'xdr.jpg':     require('../assets/xdr.jpg'),
};

const backendRoot = apiBaseUrl.replace(/\/api$/, '');

export function getServiceImageSource(image?: string | null): ImageSourcePropType | undefined {
  if (!image) return undefined;
  if (image.startsWith('http')) return { uri: image };
  const filename = image.split('/').pop() ?? image;
  if (LOCAL_IMAGES[filename]) return LOCAL_IMAGES[filename];
  return { uri: `${backendRoot}/${image}` };
}
