import './globals.css';

export const metadata = {
  title: 'PolyDraft - Fantasy Sports for Prediction Markets',
  description: 'Draft your predictions. Win real rewards. Fantasy sports meets prediction markets on Base.',
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}
