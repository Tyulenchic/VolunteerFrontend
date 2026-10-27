import { useCallback, useEffect, useState } from 'react';
import { imagesApi } from '../../api/images';
import { organizationsApi } from '../../api/organizations';
import { organizerApi } from '../../api/organizer';
import { MultiPhotoPicker } from '../../components/organizations/MultiPhotoPicker';
import { PostCard } from '../../components/organizations/PostCard';
import { PostFilePicker } from '../../components/organizations/PostFilePicker';
import { checkPostFile, fileIcon, formatSize, MAX_POST_FILES, POST_FILE_ACCEPT } from '../../utils/postFiles';
import { PhotoEditorModal, stagePhoto, type PhotoSelection } from '../../components/PhotoField';
import { CroppedImage } from '../../components/ImageCropper';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState, ErrorState } from '../../components/ui/PageStates';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { adminErrorMessage } from '../../utils/adminErrors';
import type { EventResponseDto } from '../../types/event';
import type { OrganizationPost, OrganizationSummary } from '../../types/organization';

const TAKE = 10;
const MAX_TEXT = 5000;

/**
 * Публикации организации — как записи в ленте: текст любой длины и до 10 фото. Фото выбираются сразу и уходят вместе
 * с публикацией; публикацию можно привязать к мероприятию организации («фото с мероприятия»).
 */
export function OrganizerPostsPage() {
  const { isAdmin } = useAuth();
  const { notify } = useNotification();
  const confirm = useConfirm();

  const [orgs, setOrgs] = useState<OrganizationSummary[] | null>(null);
  const [orgId, setOrgId] = useState('');
  const [events, setEvents] = useState<EventResponseDto[]>([]);

  const [text, setText] = useState('');
  const [eventId, setEventId] = useState('');
  const [photos, setPhotos] = useState<PhotoSelection[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [publishing, setPublishing] = useState(false);

  const [posts, setPosts] = useState<OrganizationPost[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<OrganizationPost | null>(null);

  useEffect(() => {
    organizerApi.summary().then(s => {
      setOrgs(s.organizations);
      setOrgId(prev => prev || s.organizations[0]?.id || '');
    }).catch(() => setOrgs([]));
  }, []);

  const loadPosts = useCallback(async (skip: number) => {
    if (!orgId) return;
    setLoading(true); setError(null);
    try {
      const page = await organizationsApi.posts(orgId, skip, TAKE);
      setPosts(prev => (skip === 0 ? page.items : [...prev, ...page.items]));
      setTotal(page.totalCount);
    } catch (err) { setError(adminErrorMessage(err, 'Не удалось загрузить публикации.')); }
    finally { setLoading(false); }
  }, [orgId]);

  useEffect(() => {
    setPosts([]); setTotal(0); setEventId('');
    if (!orgId) return;
    void loadPosts(0);
    organizationsApi.events(orgId, 0, 100).then(p => setEvents(p.items)).catch(() => setEvents([]));
  }, [orgId, loadPosts]);

  const publish = async () => {
    if (!text.trim() && photos.length === 0) {
      notify(files.length > 0 ? 'Добавьте подпись к файлам (текст публикации)' : 'Добавьте текст или хотя бы одно фото', 'error');
      return;
    }
    setPublishing(true);
    try {
      // Фото загружаются заранее, затем привязываются к публикации одним запросом — частично созданной публикации не бывает.
      const staged = [];
      for (const p of photos) {
        const s = await stagePhoto(p);
        if (s) staged.push({ imageId: s.imageId, crop: s.crop });
      }
      const created = await organizationsApi.createPost(orgId, text, eventId || null, staged);

      // Файлы уходят после создания публикации; сбой одного не отменяет публикацию и не теряет остальные.
      const failed: string[] = [];
      for (const f of files) {
        try { await organizationsApi.addPostFile(created.id, f); }
        catch (err) { failed.push(`${f.name}: ${adminErrorMessage(err, 'не загружен')}`); }
      }
      if (failed.length) notify(`Публикация создана, но не все файлы загружены. ${failed.join('; ')}. Добавьте их через «Изменить».`, 'error');
      else notify('Публикация опубликована');
      setText(''); setPhotos([]); setFiles([]); setEventId('');
      await loadPosts(0);
    } catch (err) {
      notify(adminErrorMessage(err, 'Не удалось опубликовать. Проверьте текст и фото и попробуйте ещё раз.'), 'error');
    } finally { setPublishing(false); }
  };

  const remove = async (p: OrganizationPost) => {
    if (!(await confirm({ message: 'Удалить публикацию вместе с фотографиями? Это нельзя отменить.', confirmLabel: 'Удалить', danger: true }))) return;
    try { await organizationsApi.deletePost(p.id); notify('Публикация удалена'); await loadPosts(0); }
    catch (err) { notify(adminErrorMessage(err, 'Не удалось удалить публикацию.'), 'error'); }
  };

  const toggleHidden = async (p: OrganizationPost) => {
    try { await organizationsApi.setPostHidden(p.id, !p.isHidden); await loadPosts(0); }
    catch (err) { notify(adminErrorMessage(err, 'Не удалось изменить видимость.'), 'error'); }
  };

  if (orgs === null) return <ListSkeleton />;
  if (orgs.length === 0) {
    return <EmptyState icon="fa-images" title="Нет организации для публикаций" hint="Публикации ведут организаторы организаций. Попросите администратора назначить вас организатором." />;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Публикации" description="Рассказывайте о жизни организации: фото с мероприятий и новости. Их увидят все на странице организации." />

      {orgs.length > 1 && (
        <select value={orgId} onChange={e => setOrgId(e.target.value)} aria-label="Организация" className="px-3 py-2 text-sm">
          {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      )}

      <Card>
        <CardHeader title="Новая публикация" />
        <div className="p-5 space-y-4">
          <div>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={4} maxLength={MAX_TEXT} placeholder="Что нового? Расскажите, как прошло мероприятие…"
              aria-label="Текст публикации" className="w-full px-3 py-2 text-sm bg-surface-2 border border-line-strong rounded-lg" />
            <p className="text-xs text-ink-400 mt-1 text-right">{text.length}/{MAX_TEXT}</p>
          </div>
          <MultiPhotoPicker value={photos} onChange={setPhotos} disabled={publishing} />
          <PostFilePicker value={files} onChange={setFiles} disabled={publishing} />
          <label className="block">
            <span className="block text-[13px] font-medium text-ink-700 mb-1.5">Связать с мероприятием (необязательно)</span>
            <select value={eventId} onChange={e => setEventId(e.target.value)} className="w-full px-3 py-2 text-sm">
              <option value="">Без мероприятия</option>
              {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>
          </label>
          <div className="flex justify-end">
            <Button onClick={publish} loading={publishing} disabled={!text.trim() && photos.length === 0}><i className="fas fa-paper-plane" aria-hidden /> Опубликовать</Button>
          </div>
        </div>
      </Card>

      {error ? <ErrorState message={error} onRetry={() => loadPosts(0)} />
        : posts.length === 0 && loading ? <ListSkeleton />
        : posts.length === 0 ? <EmptyState icon="fa-images" title="Публикаций пока нет" hint="Напишите первую — она появится на странице организации." />
        : (
          <div className="space-y-5">
            {posts.map(p => (
              <PostCard key={p.id} post={p}
                actions={
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(p)} aria-label="Изменить публикацию"><i className="fas fa-pen" aria-hidden /></Button>
                    {isAdmin && <Button size="sm" variant="ghost" onClick={() => toggleHidden(p)} aria-label={p.isHidden ? 'Показать публикацию' : 'Скрыть публикацию'}><i className={`fas ${p.isHidden ? 'fa-eye' : 'fa-eye-slash'}`} aria-hidden /></Button>}
                    <Button size="sm" variant="ghost" onClick={() => remove(p)} aria-label="Удалить публикацию"><i className="fas fa-trash" aria-hidden /></Button>
                  </div>
                } />
            ))}
            {posts.length < total && <div className="text-center"><Button variant="secondary" loading={loading} onClick={() => loadPosts(posts.length)}>Показать ещё</Button></div>}
          </div>
        )}

      {editing && <EditPostModal post={editing} onChanged={async () => { setEditing(null); await loadPosts(0); }} />}
    </div>
  );
}

/** Правка публикации: текст, добавление и снятие фото (каждое действие сразу сохраняется). */
function EditPostModal({ post, onChanged }: { post: OrganizationPost; onChanged: () => void }) {
  const { notify } = useNotification();
  const [current, setCurrent] = useState(post);
  const [text, setText] = useState(post.text ?? '');
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);

  const guard = async (action: () => Promise<OrganizationPost | void>, ok?: string) => {
    setBusy(true);
    try { const r = await action(); if (r) setCurrent(r); if (ok) notify(ok); }
    catch (err) { notify(adminErrorMessage(err, 'Не удалось сохранить изменения.'), 'error'); }
    finally { setBusy(false); }
  };

  const imageIdOf = (url: string) => /\/api\/images\/([0-9a-f-]{36})/i.exec(url)?.[1] ?? '';

  return (
    <Modal isOpen onClose={onChanged} title="Изменить публикацию" maxWidth="max-w-xl">
      <div className="space-y-4">
        <textarea value={text} onChange={e => setText(e.target.value)} rows={5} maxLength={MAX_TEXT} aria-label="Текст публикации"
          className="w-full px-3 py-2 text-sm bg-surface-2 border border-line-strong rounded-lg" />
        <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {current.images.map((img, i) => (
            <li key={img.url} className="relative">
              <CroppedImage src={img.thumbnailUrl} crop={img.crop} aspect={4 / 3} className="w-full" />
              <button type="button" aria-label={`Убрать фото ${i + 1}`} disabled={busy}
                onClick={() => guard(() => organizationsApi.removePostImage(current.id, imageIdOf(img.url)), 'Фото убрано')}
                className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 text-white text-xs hover:bg-red-600"><i className="fas fa-xmark" /></button>
            </li>
          ))}
          {current.images.length < 10 && (
            <li><button type="button" disabled={busy} onClick={() => setAdding(true)} aria-label="Добавить фото"
              className="w-full border-2 border-dashed border-line-strong rounded-xl text-ink-400 hover:bg-surface-3 flex items-center justify-center" style={{ aspectRatio: 4 / 3 }}>
              <i className="fas fa-plus" aria-hidden /></button></li>
          )}
        </ul>
        <div>
          <span className="block text-[13px] font-medium text-ink-700 mb-1.5">Файлы</span>
          {(current.files ?? []).length > 0 && (
            <ul className="mb-2 divide-y divide-line border border-line rounded-lg">
              {current.files.map(f => (
                <li key={f.id} className="flex items-center gap-3 px-3 py-2">
                  <i className={`fas ${fileIcon(f.fileName)} text-ink-400`} aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-[13px] text-ink-900">{f.fileName}</span>
                  <span className="text-xs text-ink-400 shrink-0">{formatSize(f.sizeBytes)}</span>
                  <button type="button" className="icon-btn is-danger" disabled={busy} aria-label={`Убрать файл ${f.fileName}`}
                    onClick={() => guard(() => organizationsApi.removePostFile(current.id, f.id), 'Файл убран')}><i className="fas fa-xmark" aria-hidden /></button>
                </li>
              ))}
            </ul>
          )}
          {(current.files ?? []).length < MAX_POST_FILES && (
            <>
              <input id="edit-post-file" type="file" accept={POST_FILE_ACCEPT} className="sr-only" disabled={busy}
                onChange={e => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  const problem = checkPostFile(file);
                  if (problem) { notify(problem, 'error'); return; }
                  void guard(() => organizationsApi.addPostFile(current.id, file), 'Файл добавлен');
                }} />
              <label htmlFor="edit-post-file" className={`btn btn-secondary btn-sm ${busy ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}>
                <i className="fas fa-paperclip" aria-hidden /> Прикрепить файл
              </label>
            </>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onChanged} disabled={busy}>Закрыть</Button>
          <Button loading={busy} disabled={text.trim() === (current.text ?? '')}
            onClick={() => guard(() => organizationsApi.updatePost(current.id, text), 'Текст сохранён')}>Сохранить текст</Button>
        </div>
      </div>
      {adding && (
        <PhotoEditorModal purpose="post" mode="pick" currentSrc={null} currentCrop={null} onClose={() => setAdding(false)}
          onApply={(r) => {
            setAdding(false);
            if (!r.file) return;
            const file = r.file;
            void guard(async () => {
              const staged = await imagesApi.stage(file);
              return organizationsApi.addPostImage(current.id, { imageId: staged.id, crop: r.crop });
            }, 'Фото добавлено');
          }} />
      )}
    </Modal>
  );
}
