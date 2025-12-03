import { MatrixBackground } from './MatrixBackground';

export function Hero() {
  return (
    <>
      <MatrixBackground />
      <section className="gradient-bg min-h-screen flex items-center justify-center relative">
        <div className="content container text-center">
          <h1 className="glow mb-6 tiktok-sans">
            Draft Your Predictions.<br />
            Win Real Rewards.
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Fantasy sports meets prediction markets. Draft real-world events like 
            fantasy players and compete for prizes in cutting-edge leagues.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a 
              href="/app" 
              className="btn-primary text-lg"
            >
              Get Started
            </a>
            <a 
              href="#how-it-works" 
              className="btn-secondary text-lg"
            >
              Learn How It Works
            </a>
          </div>
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-highlight">10K+</div>
              <div className="text-sm text-text-muted">Active Players</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-highlight">$50K+</div>
              <div className="text-sm text-text-muted">Prize Pools</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-highlight">100+</div>
              <div className="text-sm text-text-muted">Live Markets</div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
