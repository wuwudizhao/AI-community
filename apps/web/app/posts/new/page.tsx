'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChangeEvent,
  ClipboardEvent,
  FormEvent,
  Suspense,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useAuth } from '@/components/auth-provider';
import { useFeatureFlags } from '@/components/feature-flags-provider';
import { ForumHeader } from '@/components/layout/forum-header';
import { ForumShell } from '@/components/layout/forum-shell';
import { ApiError, apiRequest } from '@/lib/api';
import { CATEGORY_ICONS, FORUM_CATEGORIES, type PostCategoryValue } from '@/lib/forum-categories';
import type { PostDetail } from '@/lib/posts';
import { analyzePostContent } from '@liftoff/shared-types';

export default function NewPostPage() {
  return (
    <Suspense fallback={<div className="liftoff-community">正在准备发布页面…</div>}>
      <NewPostForm />
    </Suspense>
  );
}

function NewPostForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOpportunity = searchParams.get('tag') === '赚钱机会';
  const { user, loading } = useAuth();
  const { allowGuestPosting } = useFeatureFlags();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [category, setCategory] = useState<PostCategoryValue | ''>('');
  const [contentMarkdown, setContentMarkdown] = useState('');
  const [imageBusy, setImageBusy] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedPostImage[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const contentValueRef = useRef('');
  const analyzedContent = analyzePostContent(contentMarkdown);
  useEffect(() => {
    if (!loading && !user && !allowGuestPosting) router.replace('/login');
  }, [allowGuestPosting, loading, router, user]);

  function insertImageMarkdown(markdown: string) {
    const textarea = textareaRef.current;
    const currentContent = contentValueRef.current;
    const selectionStart = textarea?.selectionStart ?? currentContent.length;
    const selectionEnd = textarea?.selectionEnd ?? selectionStart;
    const titleLineEnd = firstNonEmptyLineEnd(currentContent);
    const selectionTouchesTitle = titleLineEnd >= 0 && selectionStart <= titleLineEnd;
    const start = selectionTouchesTitle ? titleLineEnd : selectionStart;
    const end = selectionTouchesTitle ? titleLineEnd : selectionEnd;
    const prefix = start > 0 && !currentContent.slice(0, start).endsWith('\n\n') ? '\n\n' : '';
    const suffix = end < currentContent.length || !currentContent.endsWith('\n\n') ? '\n\n' : '';
    const insertion = `${prefix}${markdown}${suffix}`;
    const next = `${currentContent.slice(0, start)}${insertion}${currentContent.slice(end)}`;
    contentValueRef.current = next;
    setContentMarkdown(next);
    requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(start + insertion.length, start + insertion.length);
    });
  }

  async function uploadImages(files: File[]) {
    if (!analyzePostContent(contentValueRef.current).titleValid) {
      setError('请先在正文第一行填写帖子标题，再上传图片');
      return;
    }
    const remaining = 8 - uploadedImages.length;
    if (remaining <= 0) {
      setError('每篇帖子最多上传 8 张图片');
      return;
    }
    const selected = files.slice(0, remaining);
    if (selected.some((file) => file.size > 5 * 1024 * 1024)) {
      setError('单张图片不能超过 5MB');
      return;
    }
    if (selected.some((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) {
      setError('仅支持 JPEG、PNG 和 WebP 图片');
      return;
    }

    setImageBusy(true);
    setError('');
    try {
      for (const file of selected) {
        const body = new FormData();
        body.append('image', file);
        const uploaded = await apiRequest<UploadedPostImage>('/post-images', {
          method: 'POST',
          body,
        });
        setUploadedImages((current) => [...current, uploaded]);
        insertImageMarkdown(uploaded.markdown);
      }
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : '图片上传失败');
    } finally {
      setImageBusy(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  }

  function selectImages(event: ChangeEvent<HTMLInputElement>) {
    void uploadImages(Array.from(event.target.files ?? []));
  }

  function pasteImages(event: ClipboardEvent<HTMLTextAreaElement>) {
    const images = Array.from(event.clipboardData.files).filter((file) =>
      file.type.startsWith('image/'),
    );
    if (images.length === 0) return;
    event.preventDefault();
    void uploadImages(images);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!category) {
      setError('请选择帖子所属分类');
      return;
    }
    if (!analyzedContent.titleValid || !analyzedContent.bodyValid) {
      setError('请在正文第一行填写标题，并在下一行继续填写正文。');
      return;
    }
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const post = await apiRequest<PostDetail>('/posts', {
        method: 'POST',
        body: JSON.stringify({
          category,
          contentMarkdown: form.get('contentMarkdown'),
          website: form.get('website'),
          tags: String(form.get('tags') ?? '')
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
        }),
      });
      router.push(`/posts/${post.slug}`);
    } catch (reason) {
      setError(
        reason instanceof ApiError && reason.status === 429
          ? '发布过于频繁，请稍后再试。'
          : reason instanceof ApiError
            ? reason.message
            : '发布失败',
      );
      setBusy(false);
    }
  }
  return (
    <div className="liftoff-community">
      <ForumHeader />
      <ForumShell>
        <section className="community-route-page community-compose-page">
          <header className="community-route-heading">
            <span className="eyebrow">Create post</span>
            <h1>{isOpportunity ? '发布赚钱机会' : '发布帖子'}</h1>
            <p>
              {isOpportunity
                ? '写下你发现的 AI 商业机会，让社区一起判断它是否值得验证。'
                : '分享赚钱机会、副业项目、收入案例、失败复盘或技术实现。'}
            </p>
            {allowGuestPosting && (
              <small className="community-compose-note">
                当前支持免注册发帖。注册账号后可在后续管理自己的内容。
              </small>
            )}
          </header>
          {loading ? (
            <div className="community-status-card" aria-live="polite">
              正在确认登录状态…
            </div>
          ) : !user && !allowGuestPosting ? (
            <div className="community-status-card" aria-live="polite">
              登录后才能发布帖子，正在前往登录页…
            </div>
          ) : (
            <form className="community-form" onSubmit={submit}>
              <div className="post-honeypot" aria-hidden="true">
                <label htmlFor="post-website">Website</label>
                <input
                  id="post-website"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>
              {isOpportunity && (
                <aside className="community-compose-guide" aria-label="赚钱机会写作提示">
                  <strong>写作提示（非必填）</strong>
                  <ol>
                    <li>机会是什么</li>
                    <li>谁可能付钱</li>
                    <li>为什么现在值得验证</li>
                    <li>最小验证动作</li>
                    <li>风险与来源</li>
                  </ol>
                </aside>
              )}
              <fieldset className="post-category-picker" aria-describedby="post-category-help">
                <legend>发布到</legend>
                <p id="post-category-help">请选择一个一级分类。分类将决定帖子归属和首页图标。</p>
                <div className="post-category-picker__grid">
                  {FORUM_CATEGORIES.map((option) => {
                    const Icon = CATEGORY_ICONS[option.iconKey];
                    const selected = category === option.dbValue;
                    return (
                      <button
                        type="button"
                        className={selected ? 'is-selected' : undefined}
                        aria-pressed={selected}
                        key={option.key}
                        onClick={() => {
                          setCategory(option.dbValue);
                          if (error === '请选择帖子所属分类') setError('');
                        }}
                      >
                        <Icon className="forum-category-icon" size={18} aria-hidden="true" />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                {!category && (
                  <small className="post-category-picker__required">请选择帖子所属分类</small>
                )}
                {category === 'MONEY_OPPORTUNITY' && (
                  <small>可使用“副业项目”“收入案例”等标签进一步描述内容。</small>
                )}
              </fieldset>
              <label>
                <span>正文</span>
                <small>第一行将作为帖子标题</small>
                <textarea
                  ref={textareaRef}
                  aria-label="正文"
                  name="contentMarkdown"
                  required
                  maxLength={50168}
                  rows={16}
                  placeholder={
                    '第一行填写帖子标题\n\n从第二行开始填写正文内容，可以直接粘贴或上传图片……'
                  }
                  value={contentMarkdown}
                  onChange={(event) => {
                    contentValueRef.current = event.target.value;
                    setContentMarkdown(event.target.value);
                  }}
                  onPaste={pasteImages}
                />
              </label>
              <aside className="post-title-preview" aria-live="polite">
                <small>帖子标题预览</small>
                <strong>
                  {analyzedContent.titleValid
                    ? analyzedContent.title
                    : '请在正文第一行填写帖子标题'}
                </strong>
              </aside>
              <section className="post-image-uploader" aria-labelledby="post-image-uploader-title">
                <div className="post-image-uploader__heading">
                  <div>
                    <strong id="post-image-uploader-title">正文图片</strong>
                    <small>
                      支持 JPEG、PNG、WebP，单张不超过 5MB，每篇最多 8 张。也可以直接粘贴图片。
                    </small>
                  </div>
                  <label className="post-image-uploader__button">
                    {imageBusy ? '上传中…' : '选择图片'}
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      disabled={imageBusy || uploadedImages.length >= 8}
                      onChange={selectImages}
                    />
                  </label>
                </div>
                {uploadedImages.length > 0 && (
                  <div className="post-image-uploader__list" aria-live="polite">
                    {uploadedImages.map((image, index) => (
                      <figure key={image.id}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image.url} alt={`已上传图片 ${index + 1}`} />
                        <figcaption>图片 {index + 1} · 已插入正文</figcaption>
                      </figure>
                    ))}
                  </div>
                )}
              </section>
              <label htmlFor="post-tags">
                <span>标签</span>
                <small>使用英文逗号分隔，最多 8 个。</small>
                <input
                  id="post-tags"
                  name="tags"
                  aria-label="标签"
                  maxLength={247}
                  defaultValue={isOpportunity ? '赚钱机会' : ''}
                />
              </label>
              {error && (
                <p role="alert" className="form-error">
                  {error}
                </p>
              )}
              <div className="community-form__actions">
                <button
                  type="submit"
                  disabled={
                    busy ||
                    imageBusy ||
                    !category ||
                    !analyzedContent.titleValid ||
                    !analyzedContent.bodyValid
                  }
                >
                  {busy ? '发布中…' : isOpportunity ? '发布赚钱机会' : '发布帖子'}
                </button>
              </div>
            </form>
          )}
        </section>
      </ForumShell>
    </div>
  );
}

type UploadedPostImage = {
  id: string;
  url: string;
  markdown: string;
  mimeType: 'image/webp';
  width: number;
  height: number;
  sizeBytes: number;
};

function firstNonEmptyLineEnd(content: string): number {
  let offset = 0;
  for (const line of content.split('\n')) {
    const end = offset + line.replace(/\r$/, '').length;
    if (/[^\s\u200B-\u200D\uFEFF]/.test(line)) return end;
    offset += line.length + 1;
  }
  return -1;
}
