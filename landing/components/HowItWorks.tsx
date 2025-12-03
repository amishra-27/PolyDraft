export function HowItWorks() {
  return (
    <section id="how-it-works" className="section">
      <div className="container text-center">
        <h2 className="mb-4">How It Works</h2>
        <p className="text-xl mb-12 max-w-3xl mx-auto">
          Get started in minutes. Draft, predict, and win with our simple fantasy-style system.
        </p>
        <div className="grid-3">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Join Leagues</h3>
            <p>
              Browse available leagues, pay entry fees, and compete against players worldwide. 
              From casual to high-stakes competitions.
            </p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Draft Markets</h3>
            <p>
              Select 10 prediction markets like fantasy players. Sports, politics, crypto, 
              culture - if there's a market, you can draft it.
            </p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Win Rewards</h3>
            <p>
              Make accurate predictions, climb leaderboards, and earn real rewards. 
              The best drafters take home the prize pools.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
