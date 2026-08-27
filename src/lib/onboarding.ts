import { redirect } from 'next/navigation';
import { getOnboarding } from './api/server';
import type { OnboardingStep } from './api/types';

export const stepToRoute: Record<OnboardingStep, string> = {
  connect: '/onboarding/connect',
  profile: '/onboarding/profile',
  sync: '/onboarding/sync',
  complete: '/network',
};

// Server-authoritative resumable onboarding: every gated page asserts the step
// it renders; anywhere else, the user is sent to the canonical screen for
// their server-side state.
export async function requireStep(expected: OnboardingStep) {
  const { currentStep } = await getOnboarding();
  if (currentStep !== expected) redirect(stepToRoute[currentStep]);
}

export async function redirectToCurrentStep(): Promise<never> {
  const { currentStep } = await getOnboarding();
  redirect(stepToRoute[currentStep]);
}
