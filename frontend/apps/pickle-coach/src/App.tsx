import { useState } from 'react';
import OnboardingFlow from './OnboardingFlow';
import CameraPlaceholder from './CameraPlaceholder';

export default function App() {
  const [onboarded, setOnboarded] = useState(false);

  return onboarded ? (
    <CameraPlaceholder />
  ) : (
    <OnboardingFlow onComplete={() => setOnboarded(true)} />
  );
}
