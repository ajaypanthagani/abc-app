import { redirect } from 'next/navigation';

// Insights now live on the dashboard's Performance page.
export default function InsightsRedirect() {
  redirect('/performance');
}
