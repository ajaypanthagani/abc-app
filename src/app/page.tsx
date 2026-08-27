import { redirectToCurrentStep } from '@/lib/onboarding';

// Dispatcher: land anywhere signed in, get sent to the canonical screen for
// your server-side onboarding state.
export default async function Root() {
  await redirectToCurrentStep();
}
