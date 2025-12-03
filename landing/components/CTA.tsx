export function CTA() {
  return (
    <section className="section gradient-bg">
      <div className="container text-center">
        <h2 className="mb-6">Ready to Become a Prediction Market Champion?</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          Join thousands of players drafting their way to victory. 
          Whether you're new to prediction markets or a seasoned pro, PolyDraft offers excitement for everyone.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <a href="/app" className="btn-primary text-lg">
            Start Playing Now
          </a>
          <a href="https://docs.polydraft.io" className="btn-secondary text-lg" target="_blank" rel="noopener noreferrer">
            Read Documentation
          </a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto text-sm">
          <div className="text-center">
            <div className="font-bold text-highlight mb-2">No Hidden Fees</div>
            <div className="text-text-muted">Transparent pricing</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-highlight mb-2">Secure</div>
            <div className="text-text-muted">Base blockchain</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-highlight mb-2">Mobile Ready</div>
            <div className="text-text-muted">Play anywhere</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-highlight mb-2">Community Driven</div>
            <div className="text-text-muted">Player focused</div>
          </div>
        </div>
      </div>
    </section>
  );
}
