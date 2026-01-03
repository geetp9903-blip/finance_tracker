import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect root requests to the new dashboard
  redirect('/dashboard');
}
