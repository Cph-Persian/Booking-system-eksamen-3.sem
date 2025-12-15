import { 
  IconScreenShare, 
  IconDeviceDesktop, 
  IconPlug, 
  IconMicrophone, 
  IconVolume,
  IconPresentation,
  IconWifi,
  IconDeviceProjector
} from '@tabler/icons-react';

export function getFeatureIcon(feature: string) {
  const lowerFeature = feature.toLowerCase().trim();
  if (lowerFeature.includes('skærm') || lowerFeature.includes('screen') || lowerFeature.includes('display')) return IconScreenShare;
  if (lowerFeature.includes('whiteboard') || lowerFeature.includes('tavle')) return IconPresentation;
  if (lowerFeature.includes('oplader') || lowerFeature.includes('charger') || lowerFeature.includes('forlænger')) return IconPlug;
  if (lowerFeature.includes('mikrofon') || lowerFeature.includes('microphone')) return IconMicrophone;
  if (lowerFeature.includes('højtaler') || lowerFeature.includes('speaker') || lowerFeature.includes('sound')) return IconVolume;
  if (lowerFeature.includes('wifi') || lowerFeature.includes('internet')) return IconWifi;
  if (lowerFeature.includes('projector') || lowerFeature.includes('projektor')) return IconDeviceProjector;
  if (lowerFeature.includes('computer') || lowerFeature.includes('pc')) return IconDeviceDesktop;
  return IconPlug;
}

