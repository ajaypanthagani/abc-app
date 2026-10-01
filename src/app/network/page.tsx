import { redirect } from 'next/navigation';

// The pre-dashboard terminal page; kept so old links and bookmarks land on
// the dashboard.
export default function NetworkRedirect() {
  redirect('/home');
}
