import { redirectToCurrentStep } from '@/lib/onboarding';

// The API's OAuth callback 302s here after setting the session cookie. Zero
// UI: resolve the server-side step and go.
export default async function AuthCallback() {
  await redirectToCurrentStep();
}
