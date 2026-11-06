'use client';
import dynamic from 'next/dynamic';
const App = dynamic(() => import('../App'), {
  ssr: false,
  loading: () => (
    <div className="boot-screen">
      ♞ <span>Setting up your board…</span>
    </div>
  ),
});
export default function Page() {
  return <App />;
}
