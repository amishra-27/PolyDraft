import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { Features } from './components/Features';
import { CTA } from './components/CTA';

export default function LandingPage() {
  return (
    <main className="content">
      <Hero />
      <HowItWorks />
      <Features />
      <CTA />
    </main>
  );
}
