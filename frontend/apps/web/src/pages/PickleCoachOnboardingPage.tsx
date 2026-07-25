import { useNavigate } from 'react-router-dom';
import OnboardingFlow from '../pickle-coach/OnboardingFlow';

export default function PickleCoachOnboardingPage() {
  const navigate = useNavigate();

  return <OnboardingFlow onComplete={() => navigate('/camera')} />;
}
