'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Bold,
  CheckCircle2,
  Circle,
  Code2,
  Globe2,
  Heading1,
  Heading2,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  ShieldCheck,
} from 'lucide-react';
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
import { ApiError, apiRequest } from '@/lib/api';
import {
  BUSINESS_CATEGORIES,
  CATEGORY_ICONS,
  FORUM_CATEGORIES,
  TECHNICAL_CATEGORIES,
  type PostCategoryValue,
} from '@/lib/forum-categories';
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
  const [category, setCategory] = useState<PostCategoryValue | ''>(
    isOpportunity ? 'MONEY_OPPORTUNITY' : '',
  );
  const [title, setTitle] = useState('');
  const [bodyMarkdown, setBodyMarkdown] = useState('');
  const [tags, setTags] = useState(isOpportunity ? '赚钱机会' : '');
  const [draftReady, setDraftReady] = useState(false);
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [draftSavedAt, setDraftSavedAt] = useState('');
  const [imageBusy, setImageBusy] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedPostImage[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const contentValueRef = useRef('');
  const draftKey = isOpportunity ? 'liftoff-post-draft-opportunity' : 'liftoff-post-draft';
  const contentMarkdown = `${title.trim()}\n\n${bodyMarkdown}`;
  const analyzedContent = analyzePostContent(contentMarkdown);
  useEffect(() => {
    if (!loading && !user && !allowGuestPosting) router.replace('/login');
  }, [allowGuestPosting, loading, router, user]);

  useEffect(() => {
    const restoreDraft = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(draftKey);
        if (saved) {
          const draft = JSON.parse(saved) as PostDraft;
          const restoredCategory = FORUM_CATEGORIES.some(
            (option) => option.dbValue === draft.category,
          )
            ? draft.category
            : '';
          setTitle(draft.title ?? '');
          setBodyMarkdown(draft.bodyMarkdown ?? '');
          contentValueRef.current = draft.bodyMarkdown ?? '';
          setCategory(restoredCategory);
          setTags(draft.tags ?? (isOpportunity ? '赚钱机会' : ''));
          setDraftSavedAt(draft.savedAt ?? '');
          setDraftStatus('saved');
        }
      } catch {
        window.localStorage.removeItem(draftKey);
      } finally {
        setDraftReady(true);
      }
    }, 0);
    return () => window.clearTimeout(restoreDraft);
  }, [draftKey, isOpportunity]);

  useEffect(() => {
    if (!draftReady) return;
    const timeout = window.setTimeout(() => {
      const savedAt = new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      window.localStorage.setItem(
        draftKey,
        JSON.stringify({ title, bodyMarkdown, category, tags, savedAt } satisfies PostDraft),
      );
      setDraftSavedAt(savedAt);
      setDraftStatus('saved');
    }, 600);
    return () => window.clearTimeout(timeout);
  }, [bodyMarkdown, category, draftKey, draftReady, tags, title]);

  function saveDraftNow() {
    const savedAt = new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    window.localStorage.setItem(
      draftKey,
      JSON.stringify({ title, bodyMarkdown, category, tags, savedAt } satisfies PostDraft),
    );
    setDraftSavedAt(savedAt);
    setDraftStatus('saved');
  }

  function insertImageMarkdown(markdown: string) {
    const textarea = textareaRef.current;
    const currentContent = contentValueRef.current;
    const selectionStart = textarea?.selectionStart ?? currentContent.length;
    const selectionEnd = textarea?.selectionEnd ?? selectionStart;
    const start = selectionStart;
    const end = selectionEnd;
    const prefix = start > 0 && !currentContent.slice(0, start).endsWith('\n\n') ? '\n\n' : '';
    const suffix = end < currentContent.length || !currentContent.endsWith('\n\n') ? '\n\n' : '';
    const insertion = `${prefix}${markdown}${suffix}`;
    const next = `${currentContent.slice(0, start)}${insertion}${currentContent.slice(end)}`;
    contentValueRef.current = next;
    setBodyMarkdown(next);
    requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(start + insertion.length, start + insertion.length);
    });
  }

  async function uploadImages(files: File[]) {
    if (!analyzedContent.titleValid) {
      setError('请先填写一个有效的帖子标题，再上传图片');
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

  function insertMarkdown(prefix: string, suffix: string, placeholder: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const currentContent = contentValueRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = currentContent.slice(start, end) || placeholder;
    const insertion = `${prefix}${selected}${suffix}`;
    const next = `${currentContent.slice(0, start)}${insertion}${currentContent.slice(end)}`;
    contentValueRef.current = next;
    setBodyMarkdown(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    });
  }

  function insertLinePrefix(prefix: string, placeholder: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const currentContent = contentValueRef.current;
    const start = textarea.selectionStart;
    const lineStart = currentContent.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
    const end = textarea.selectionEnd;
    const selected = currentContent.slice(lineStart, end) || placeholder;
    const insertion = selected
      .split('\n')
      .map((line) => `${prefix}${line}`)
      .join('\n');
    const next = `${currentContent.slice(0, lineStart)}${insertion}${currentContent.slice(end)}`;
    contentValueRef.current = next;
    setBodyMarkdown(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart + prefix.length, lineStart + insertion.length);
    });
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
          contentMarkdown,
          website: form.get('website'),
          tags: String(form.get('tags') ?? '')
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
        }),
      });
      window.localStorage.removeItem(draftKey);
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
  const selectedCategory = FORUM_CATEGORIES.find((item) => item.dbValue === category);
  const technicalCategory = TECHNICAL_CATEGORIES.some((item) => item.dbValue === category)
    ? category
    : '';
  const canPublish =
    Boolean(category) && analyzedContent.titleValid && analyzedContent.bodyValid;

  return (
    <div className="liftoff-community compose-community">
      <ForumHeader />
      <main className="compose-workspace">
        <section className="compose-page" aria-labelledby="compose-page-title">
          <nav className="compose-breadcrumb" aria-label="面包屑导航">
            <Link href="/">返回社区</Link>
            <span aria-hidden="true">/</span>
            <strong>发布帖子</strong>
          </nav>
          <div className="compose-page__intro">
            <div>
              <h1 id="compose-page-title">{isOpportunity ? '发布赚钱机会' : '发布帖子'}</h1>
              <p>分享一个值得讨论的发现</p>
            </div>
            {allowGuestPosting && (
              <small className="community-compose-note">
                当前支持免注册发帖。注册账号后可在后续管理自己的内容。
              </small>
            )}
          </div>
          {loading ? (
            <div className="community-status-card" aria-live="polite">正在确认登录状态…</div>
          ) : !user && !allowGuestPosting ? (
            <div className="community-status-card" aria-live="polite">
              登录后才能发布帖子，正在前往登录页…
            </div>
          ) : (
            <form className="compose-form" onSubmit={submit}>
              <div className="post-honeypot" aria-hidden="true">
                <label htmlFor="post-website">Website</label>
                <input id="post-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
              </div>
              <div className="compose-layout">
                <div className="compose-editor-column">
                  {isOpportunity && (
                    <aside className="community-compose-guide" aria-label="赚钱机会写作提示">
                      <strong>写作提示（非必填）</strong>
                      <ol>
                        <li>机会是什么</li><li>谁可能付钱</li><li>为什么现在值得验证</li>
                        <li>最小验证动作</li><li>风险与来源</li>
                      </ol>
                    </aside>
                  )}
                  <section className="compose-editor" aria-label="帖子编辑器">
                    <div className="compose-toolbar" role="toolbar" aria-label="正文格式工具">
                      <div className="compose-toolbar__group">
                        <button type="button" aria-label="加粗" onClick={() => insertMarkdown('**', '**', '加粗文字')}><Bold size={18} /></button>
                        <button type="button" aria-label="斜体" onClick={() => insertMarkdown('*', '*', '斜体文字')}><Italic size={18} /></button>
                        <button type="button" aria-label="一级标题" onClick={() => insertLinePrefix('# ', '一级标题')}><Heading1 size={19} /></button>
                        <button type="button" aria-label="二级标题" onClick={() => insertLinePrefix('## ', '二级标题')}><Heading2 size={19} /></button>
                      </div>
                      <div className="compose-toolbar__group">
                        <button type="button" aria-label="无序列表" onClick={() => insertLinePrefix('- ', '列表项目')}><List size={19} /></button>
                        <button type="button" aria-label="有序列表" onClick={() => insertLinePrefix('1. ', '列表项目')}><ListOrdered size={19} /></button>
                        <button type="button" aria-label="引用" onClick={() => insertLinePrefix('> ', '引用内容')}><Quote size={18} /></button>
                        <button type="button" aria-label="行内代码" onClick={() => insertMarkdown('`', '`', '代码')}><Code2 size={18} /></button>
                        <button type="button" aria-label="插入链接" onClick={() => insertMarkdown('[', '](https://)', '链接文字')}><Link2 size={18} /></button>
                      </div>
                      <label className="compose-toolbar__upload" htmlFor="post-images">
                        <ImagePlus size={18} /><span>{imageBusy ? '上传中…' : '插入图片'}</span>
                      </label>
                      <span className="compose-toolbar__hint">支持 Markdown</span>
                    </div>
                    <div className="compose-canvas">
                      <label className="sr-only" htmlFor="post-title">标题</label>
                      <input
                        id="post-title"
                        className="compose-title-input"
                        aria-label="标题"
                        required
                        maxLength={160}
                        placeholder="请输入标题（3–160 字）"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                      />
                      <label className="sr-only" htmlFor="post-body">正文</label>
                      <textarea
                        id="post-body"
                        ref={textareaRef}
                        aria-label="正文"
                        name="bodyMarkdown"
                        required
                        maxLength={50000}
                        rows={20}
                        placeholder="从这里开始分享你的经验、问题或新发现……"
                        value={bodyMarkdown}
                        onChange={(event) => {
                          contentValueRef.current = event.target.value;
                          setBodyMarkdown(event.target.value);
                        }}
                        onPaste={pasteImages}
                      />
                    </div>
                    <div className="compose-upload-strip">
                      <label htmlFor="post-images">
                        <ImagePlus size={20} />
                        <span><strong>{imageBusy ? '图片上传中…' : '拖拽或点击上传图片'}</strong><small>支持 JPEG、PNG、WebP，单张不超过 5MB</small></span>
                      </label>
                      <span>{uploadedImages.length}/8</span>
                      <input
                        id="post-images"
                        ref={imageInputRef}
                        aria-label="选择图片"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        disabled={imageBusy || uploadedImages.length >= 8}
                        onChange={selectImages}
                      />
                    </div>
                    {uploadedImages.length > 0 && (
                      <div className="compose-image-list" aria-live="polite">
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
                  {error && <p role="alert" className="form-error">{error}</p>}
                  <div className="compose-draft-status" aria-live="polite">
                    <span><CheckCircle2 size={16} />{draftStatus === 'saving' ? '正在保存草稿…' : draftStatus === 'saved' ? `草稿已保存${draftSavedAt ? ` · ${draftSavedAt}` : ''}` : '草稿保存在此设备'}</span>
                    <span>{title.length}/160 字标题 · {bodyMarkdown.length.toLocaleString()}/50,000 字正文</span>
                  </div>
                </div>

                <aside className="compose-publish-panel" aria-label="发布设置">
                  <section>
                    <h2>发布到</h2>
                    <div className="compose-category-list">
                      {BUSINESS_CATEGORIES.map((option) => {
                        const Icon = CATEGORY_ICONS[option.iconKey];
                        const selected = category === option.dbValue;
                        return (
                          <button
                            key={option.key}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => { setCategory(option.dbValue); setError(''); }}
                          >
                            <Icon size={20} aria-hidden="true" />
                            <span><strong>{option.label}</strong><small>{option.description}</small></span>
                            {selected ? <CheckCircle2 size={18} aria-label="已选择" /> : <Circle size={18} aria-hidden="true" />}
                          </button>
                        );
                      })}
                    </div>
                    <label className="compose-more-category" htmlFor="post-category">
                      <span>更多技术分类</span>
                      <select
                        id="post-category"
                        aria-label="发布到"
                        value={technicalCategory}
                        onChange={(event) => { setCategory(event.target.value as PostCategoryValue | ''); setError(''); }}
                      >
                        <option value="">请选择</option>
                        {TECHNICAL_CATEGORIES.map((option) => <option key={option.key} value={option.dbValue}>{option.label}</option>)}
                      </select>
                    </label>
                    {selectedCategory && <p className="compose-selected-category">已选择：{selectedCategory.label}</p>}
                  </section>
                  <section>
                    <label className="compose-panel-label" htmlFor="post-tags">标签</label>
                    <input
                      id="post-tags"
                      name="tags"
                      aria-label="标签"
                      maxLength={247}
                      placeholder="输入标签，用英文逗号分隔"
                      value={tags}
                      onChange={(event) => setTags(event.target.value)}
                    />
                    <small>合适的标签能帮助读者发现你的帖子</small>
                  </section>
                  <section className="compose-publish-meta">
                    <div><ShieldCheck size={20} /><span><strong>原创内容</strong><small>内容由你本人发布</small></span></div>
                    <div><Globe2 size={20} /><span><strong>公开可见</strong><small>所有社区用户都能阅读</small></span></div>
                  </section>
                  <section className="compose-checklist">
                    <h2>发布前检查</h2>
                    <p>{analyzedContent.titleValid ? <CheckCircle2 size={17} /> : <Circle size={17} />} 已填写有效标题</p>
                    <p>{category ? <CheckCircle2 size={17} /> : <Circle size={17} />} 已选择发布分类</p>
                    <p>{analyzedContent.bodyValid ? <CheckCircle2 size={17} /> : <Circle size={17} />} 正文内容完整</p>
                  </section>
                  <div className="compose-panel-actions">
                    <button type="submit" disabled={busy || imageBusy || !canPublish}>
                      {busy ? '发布中…' : isOpportunity ? '发布赚钱机会' : '发布帖子'}
                    </button>
                    <button type="button" onClick={saveDraftNow}>保存草稿</button>
                  </div>
                </aside>
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}

type PostDraft = {
  title: string;
  bodyMarkdown: string;
  category: PostCategoryValue | '';
  tags: string;
  savedAt: string;
};

type UploadedPostImage = {
  id: string;
  url: string;
  markdown: string;
  mimeType: 'image/webp';
  width: number;
  height: number;
  sizeBytes: number;
};
