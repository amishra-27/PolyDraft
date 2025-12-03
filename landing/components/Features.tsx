export function Features() {
  const features = [
    {
      title: "Fantasy Draft Mechanics",
      description: "Draft prediction markets just like fantasy sports. Pick your 10 markets and compete against other drafters."
    },
    {
      title: "Real Market Data",
      description: "Powered by Polymarket API with real-time odds and live market updates from trusted prediction sources."
    },
    {
      title: "League Competition",
      description: "Create or join leagues with friends. Set entry fees, prize pools, and compete in weekly or season-long contests."
    },
    {
      title: "Mobile-First Design",
      description: "Draft on the go with our optimized mobile interface. Perfect for checking markets and making picks anywhere."
    },
    {
      title: "Base Blockchain",
      description: "Built on Base for fast, cheap transactions and transparent smart contracts you can trust."
    },
    {
      title: "Reward System",
      description: "Climb leaderboards, earn achievements, and win real prizes. From bragging rights to significant payouts."
    }
  ];

  return (
    <section className="section">
      <div className="container">
        <h2 className="text-center mb-4">Why Choose PolyDraft?</h2>
        <p className="text-xl text-center mb-12 max-w-3xl mx-auto">
          Traditional fantasy sports are limited to player performance. PolyDraft lets you draft 
          <span className="text-highlight"> ANY real-world event</span> with a prediction market.
        </p>
        <div className="grid-3">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
