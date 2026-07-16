import Link from 'next/link';

export function LiftoffHero() {
  return (
    <section className="liftoff-hero" aria-labelledby="liftoff-hero-title">
      <div className="liftoff-hero__accessible-copy">
        <h1 id="liftoff-hero-title">
          发现 <em className="hero-highlight hero-highlight--opportunity">AI 赚钱机会</em>
          <br />
          把想法变成<em className="hero-highlight hero-highlight--income">收入</em>
        </h1>
        <p>从机会发现 → 项目验证 → 实战分享 → 持续赚钱</p>
      </div>
      <div className="liftoff-hero__actions" aria-label="Hero actions">
        <Link className="hero-button is-primary" href="/opportunities">
          <span className="sr-only">发现赚钱机会</span>
        </Link>
        <Link className="hero-button" href="/posts/new">
          <span className="sr-only">发布项目想法</span>
        </Link>
      </div>
    </section>
  );
}
