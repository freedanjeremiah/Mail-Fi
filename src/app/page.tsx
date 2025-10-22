import { redirect } from 'next/navigation';

export default function Home() {
  // Server-side redirect to the Nexus panel page where the Mail-Fi UI lives.
  // This ensures the root opens the integrated Nexus UI instead of the Next.js template.
  redirect('/nexus-panel');
}
