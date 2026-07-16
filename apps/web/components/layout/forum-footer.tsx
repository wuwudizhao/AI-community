import Link from 'next/link';

export function ForumFooter() {
  return (
    <footer className="community-footer" id="about">
      <div>
        <div>
          <strong>Liftoff</strong>
          <p>帮助普通人利用 AI 发现机会、验证项目并创造收入。</p>
        </div>
        <nav aria-label="页脚导航">
          <Link href="/">首页</Link>
          <Link href="/#feed">社区内容</Link>
        </nav>
        <small>© 2026 Liftoff</small>
      </div>
    </footer>
  );
}
