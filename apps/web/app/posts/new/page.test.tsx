import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NewPostPage from './page';

let tag: string | null = null;
let authState: Record<string, unknown>;
let allowGuestPosting = true;
const push = vi.fn();
const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push }),
  usePathname: () => '/posts/new',
  useSearchParams: () => new URLSearchParams(tag ? `tag=${encodeURIComponent(tag)}` : ''),
}));
vi.mock('@/components/auth-provider', () => ({ useAuth: () => authState }));
vi.mock('@/components/feature-flags-provider', () => ({
  useFeatureFlags: () => ({ allowGuestPosting }),
}));
vi.mock('@/components/layout/forum-header', () => ({ ForumHeader: () => null }));

describe('New post page', () => {
  beforeEach(() => {
    tag = null;
    allowGuestPosting = true;
    authState = {
      user: { id: 'user-1', displayName: '测试用户', username: 'test-user' },
      loading: false,
    };
    push.mockReset();
    replace.mockReset();
    vi.mocked(fetch).mockReset();
    window.localStorage.clear();
  });

  it('pre-fills the released opportunity tag and gives optional writing guidance', () => {
    tag = '赚钱机会';
    render(<NewPostPage />);

    expect(screen.getByRole('heading', { name: '发布赚钱机会' })).toBeInTheDocument();
    expect(screen.getByLabelText('赚钱机会写作提示')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '标签' })).toHaveValue('赚钱机会');
    expect(screen.getByRole('button', { name: '发布赚钱机会' })).toBeInTheDocument();
  });

  it('shows the immersive writing canvas and formatting toolbar', () => {
    render(<NewPostPage />);

    expect(screen.getByRole('heading', { name: '发布帖子' })).toBeInTheDocument();
    expect(screen.getByRole('toolbar', { name: '正文格式工具' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '加粗' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '标题' })).toHaveAttribute(
      'placeholder',
      '请输入标题（3–160 字）',
    );
    expect(screen.getByRole('textbox', { name: '正文' })).toHaveAttribute(
      'placeholder',
      '从这里开始分享你的经验、问题或新发现……',
    );
    expect(screen.getByRole('combobox', { name: '发布到' })).toHaveValue('');
    expect(screen.getByText('原创内容')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '发布帖子' })).toBeDisabled();
  });

  it('selects one category and enables publishing after title and body are valid', () => {
    render(<NewPostPage />);
    const category = screen.getByRole('combobox', { name: '发布到' });

    fireEvent.change(category, { target: { value: 'AGENT' } });
    expect(category).toHaveValue('AGENT');
    fireEvent.change(category, { target: { value: 'RAG' } });
    expect(category).toHaveValue('RAG');
    fireEvent.change(screen.getByRole('textbox', { name: '标题' }), {
      target: { value: '分类单选标题' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: '正文' }), {
      target: { value: '正文内容' },
    });

    expect(screen.getByRole('button', { name: '发布帖子' })).toBeEnabled();
  });

  it('applies Markdown formatting from the toolbar to the body selection', () => {
    render(<NewPostPage />);
    const body = screen.getByRole('textbox', { name: '正文' }) as HTMLTextAreaElement;
    fireEvent.change(body, { target: { value: '需要强调' } });
    body.setSelectionRange(0, 4);

    fireEvent.click(screen.getByRole('button', { name: '加粗' }));

    expect(body).toHaveValue('**需要强调**');
  });

  it('does not accept image Markdown as the title', () => {
    render(<NewPostPage />);
    fireEvent.change(screen.getByRole('textbox', { name: '标题' }), {
      target: { value: '![图片](https://example.com/a.png)' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: '正文' }), {
      target: { value: '正文内容' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: '发布到' }), {
      target: { value: 'AGENT' },
    });

    expect(screen.getByRole('button', { name: '发布帖子' })).toBeDisabled();
  });

  it('asks for a title before uploading an image', async () => {
    render(<NewPostPage />);
    const file = new File(['png'], 'example.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('选择图片'), { target: { files: [file] } });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '请先填写一个有效的帖子标题，再上传图片',
    );
    expect(screen.getByRole('textbox', { name: '正文' })).toHaveValue('');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not submit without a category and shows the required message', () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({}),
    } as Response);
    const { container } = render(<NewPostPage />);
    fireEvent.submit(container.querySelector('form')!);
    expect(screen.getByRole('alert')).toHaveTextContent('请选择帖子所属分类');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('uploads an image and inserts the returned Markdown into the body', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        id: 'cmrpostimage000000000001',
        url: 'http://localhost:4000/api/post-images/cmrpostimage000000000001',
        markdown: '![example](http://localhost:4000/api/post-images/cmrpostimage000000000001)',
        mimeType: 'image/webp',
        width: 32,
        height: 24,
        sizeBytes: 120,
      }),
    } as Response);
    render(<NewPostPage />);
    fireEvent.change(screen.getByRole('textbox', { name: '标题' }), {
      target: { value: '图文帖子标题' },
    });
    const body = screen.getByRole('textbox', { name: '正文' }) as HTMLTextAreaElement;
    body.setSelectionRange(0, 0);
    const file = new File(['png'], 'example.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('选择图片'), { target: { files: [file] } });

    await waitFor(() => expect(body.value).toContain('/api/post-images/cmrpostimage000000000001'));
    expect(screen.getByRole('textbox', { name: '标题' })).toHaveValue('图文帖子标题');
    expect(screen.getByAltText('已上传图片 1')).toBeInTheDocument();
    const uploadCall = vi.mocked(fetch).mock.calls[0];
    expect(String(uploadCall[0])).toContain('/post-images');
    expect(uploadCall[1]).toMatchObject({ method: 'POST' });
    expect(uploadCall[1]?.body).toBeInstanceOf(FormData);
    expect(uploadCall[1]?.headers).toBeUndefined();
  });

  it('rejects oversized images before sending a request', async () => {
    render(<NewPostPage />);
    fireEvent.change(screen.getByRole('textbox', { name: '标题' }), {
      target: { value: '大图校验标题' },
    });
    const file = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', {
      type: 'image/png',
    });
    fireEvent.change(screen.getByLabelText('选择图片'), { target: { files: [file] } });

    expect(await screen.findByRole('alert')).toHaveTextContent('单张图片不能超过 5MB');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('lets a guest fill and submit the form without redirecting to login', async () => {
    authState = { user: null, loading: false };
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ slug: 'guest-post' }),
    } as Response);
    render(<NewPostPage />);

    expect(replace).not.toHaveBeenCalled();
    expect(
      screen.getByText('当前支持免注册发帖。注册账号后可在后续管理自己的内容。'),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: '标题' }), {
      target: { value: '游客发布标题' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: '正文' }), {
      target: { value: '游客发布正文' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: '标签' }), {
      target: { value: '游客,讨论' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: '发布到' }), {
      target: { value: 'AGENT' },
    });
    fireEvent.click(screen.getByRole('button', { name: '发布帖子' }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/posts/guest-post'));
    const request = vi.mocked(fetch).mock.calls.find(([url]) => String(url).includes('/posts'));
    expect(JSON.parse(String(request?.[1]?.body))).toMatchObject({
      category: 'AGENT',
      contentMarkdown: '游客发布标题\n\n游客发布正文',
    });
    expect(JSON.parse(String(request?.[1]?.body))).not.toHaveProperty('title');
    expect(document.querySelector('input[name="website"]')).toBeInTheDocument();
  });

  it('restores the login requirement when guest posting is disabled', async () => {
    authState = { user: null, loading: false };
    allowGuestPosting = false;
    render(<NewPostPage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'));
    expect(screen.queryByRole('button', { name: '发布帖子' })).not.toBeInTheDocument();
    expect(screen.getByText('登录后才能发布帖子，正在前往登录页…')).toBeInTheDocument();
  });

  it('keeps the authenticated publishing form available when guest posting is disabled', () => {
    allowGuestPosting = false;
    render(<NewPostPage />);

    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '发布帖子' })).toBeInTheDocument();
  });

  it('shows the required friendly message for a 429 response', async () => {
    authState = { user: null, loading: false };
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ message: 'Too Many Requests' }),
    } as Response);
    render(<NewPostPage />);
    fireEvent.change(screen.getByRole('textbox', { name: '标题' }), {
      target: { value: '频率限制标题' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: '正文' }), {
      target: { value: '频率限制正文' },
    });
    fireEvent.click(screen.getByRole('button', { name: /失败复盘/ }));
    fireEvent.click(screen.getByRole('button', { name: '发布帖子' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('发布过于频繁，请稍后再试。');
  });
});
