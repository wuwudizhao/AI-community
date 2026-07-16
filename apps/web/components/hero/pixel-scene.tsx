export function PixelScene() {
  return (
    <div className="pixel-scene" aria-label="Liftoff 原创静态像素 Builder 场景">
      <span className="pixel-star pixel-star--one" />
      <span className="pixel-star pixel-star--two" />
      <span className="pixel-orbit" aria-hidden="true" />
      <span className="pixel-cloud pixel-cloud--one" />
      <span className="pixel-cloud pixel-cloud--two" />
      <span className="pixel-token pixel-token--one">$</span>
      <span className="pixel-token pixel-token--two">$</span>
      <span className="pixel-token pixel-token--three">$</span>
      <span className="pixel-tree pixel-tree--one" aria-hidden="true" />
      <span className="pixel-tree pixel-tree--two" aria-hidden="true" />
      <span className="pixel-question" aria-label="原创机会数据方块">
        ?
      </span>
      <div className="pixel-builder" aria-label="原创 Builder 角色">
        <span className="pixel-builder__head" />
        <span className="pixel-builder__body" />
        <span className="pixel-builder__tool" />
        <span className="pixel-builder__feet" />
      </div>
      <div className="pixel-bug" aria-label="Bug 障碍">
        <span />
        BUG
      </div>
      <PixelSign className="pixel-sign--agent" label="IDEA" />
      <div className="pixel-portal" aria-label="Liftoff Portal">
        <strong>LIFTOFF</strong>
        <span />
      </div>
      <div className="pixel-hills" />
      <div className="pixel-ground">
        <span />
      </div>
    </div>
  );
}

function PixelSign({ label, className }: { label: string; className: string }) {
  return (
    <span className={`pixel-sign ${className}`}>
      {label}
      <i />
    </span>
  );
}
