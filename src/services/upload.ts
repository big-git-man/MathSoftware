import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { randomUUID } from 'expo-crypto';
import { supabase } from '../api/supabase';
import type { Tables } from '../types/db';

export type DocumentRow = Tables<'documents'>;
export type AssignmentRow = Tables<'assignments'>;
export type UploadableFile = {
  uri: string;
  mimeType?: string;
  fileName?: string;
  width?: number;
  height?: number;
  size?: number;
};

export type AssignmentType = AssignmentRow['type'];
export type ProcessingStatus = NonNull<DocumentRow['processing_status']>;
type NonNull<T> = T extends null | undefined ? never : T;

const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp', 'image/jpg'];
const ALLOWED_DOC = ['application/pdf'];
const ALLOWED_MIME = [...ALLOWED_IMAGE, ...ALLOWED_DOC];
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
export const DOCUMENTS_BUCKET = 'documents' as const;

export type ValidationError = { ok: false; reason: string };
export type ValidatedFile = UploadableFile & {
  id: string;
  size: number;
  mimeType: string;
  extension: string;
  width?: number;
  height?: number;
  blob: Blob;
  thumbnailBlob?: Blob | null;
};

export async function validateAndPrepare(file: UploadableFile): Promise<ValidatedFile | ValidationError> {
  const { uri, mimeType, size: givenSize } = file;
  if (!uri) return { ok: false as const, reason: 'No file selected' };
  const info = await FileSystem.getInfoAsync(uri, { shouldCalcSum: false });
  if (!info.exists) return { ok: false as const, reason: 'File does not exist' };
  const size = givenSize ?? info.size ?? 0;
  if (size > MAX_FILE_SIZE) return { ok: false as const, reason: 'File is too large (max 100 MB)' };
  const mime = (mimeType ?? guessMime(uri)).toLowerCase();
  if (!ALLOWED_MIME.includes(mime)) return { ok: false as const, reason: `Unsupported file type: ${mime}` };
  const ext = (mime === 'application/pdf' ? 'pdf' : mime.replace('image/', ''));
  let width = file.width;
  let height = file.height;
  let thumbnailBlob: Blob | null = null;
  if (ALLOWED_IMAGE.includes(mime)) {
    const blob = await uriToBlob(uri, mime);
    thumbnailBlob = await generateThumbnailBlob(uri, mime);
    if (width == null || height == null) {
      const meta = await imageMeta(uri);
      width = meta.width;
      height = meta.height;
    }
    return { ...file, id: randomUUID(), size, mimeType: mime, extension: ext, width, height, blob: blob, thumbnailBlob };
  }
  const blob = await uriToBlob(uri, mime);
  return { ...file, id: randomUUID(), size, mimeType: mime, extension: ext, blob, thumbnailBlob: null };
}

function guessMime(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.heic')) return 'image/heic';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

async function uriToBlob(uri: string, mime: string): Promise<Blob> {
  const res = await fetch(uri);
  return res.blob();
}

async function generateThumbnailBlob(uri: string, mime: string): Promise<Blob | null> {
  try {
    const result = await manipulateAsync(
      uri,
      [{ resize: { width: 400 } }],
      { compressImageQuality: 0.7, format: SaveFormat.JPEG, base64: false }
    );
    return uriToBlob(result.uri, 'image/jpeg');
  } catch {
    return null;
  }
}

async function imageMeta(uri: string): Promise<{ width: number; height: number }> {
  try {
    const res = await manipulateAsync(uri, []);
    return { width: res.width, height: res.height };
  } catch {
    return { width: 0, height: 0 };
  }
}

export function storagePathFor(userId: string, documentId: string, kind: 'original' | 'thumbnail'): string {
  return `user/${userId}/documents/${documentId}/${kind}`;
}

export async function uploadBlob(
  userId: string,
  documentId: string,
  kind: 'original' | 'thumbnail',
  blob: Blob,
  contentType: string
): Promise<string> {
  const path = storagePathFor(userId, documentId, kind);
  const { error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(path, blob, { upsert: true, contentType });
  if (error) throw error;
  return path;
}

export async function createDocumentRecord(input: {
  userId: string;
  originalFilename: string;
  storagePath: string;
  thumbnailPath: string | null;
  mimeType: string;
  extension: string;
  fileSize: number;
  width?: number;
  height?: number;
  assignmentId?: string;
  documentType: AssignmentType;
  topicId?: string;
  courseId?: string;
  subjectId?: string;
  tags?: string[];
  capturedAt?: string;
}) {
  const { data, error } = await supabase
    .from('documents')
    .insert({
      user_id: input.userId,
      original_filename: input.originalFilename,
      storage_bucket: DOCUMENTS_BUCKET,
      storage_path: input.storagePath,
      thumbnail_path: input.thumbnailPath,
      mime_type: input.mimeType,
      extension: input.extension,
      file_size: input.fileSize,
      width: input.width,
      height: input.height,
      assignment_id: input.assignmentId,
      document_type: input.documentType,
      topic_id: input.topicId,
      course_id: input.courseId,
      subject_id: input.subjectId,
      processing_status: 'uploading',
      captured_at: input.capturedAt,
    })
    .select()
    .single();
  return { document: data as DocumentRow | null, error };
}

export type UploadOptions = {
  documentType: AssignmentType;
  assignmentName?: string;
  topicId?: string;
  courseId?: string;
  subjectId?: string;
  tags?: string[];
  onProgress?: (uploaded: number, total: number, document?: DocumentRow) => void;
};

export type UploadResult = {
  assignmentId?: string;
  documents: DocumentRow[];
};

export async function uploadDocuments(files: UploadableFile[], opts: UploadOptions): Promise<UploadResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 1. Create an assignment to group the files (homework may be multi-image).
  let assignmentId: string | undefined;
  if (files.length > 1 || opts.assignmentName) {
    const name = opts.assignmentName ?? `${opts.documentType} — ${new Date().toLocaleDateString()}`;
    const { data: asgn, error: aErr } = await supabase
      .from('assignments')
      .insert({
        user_id: user.id,
        name,
        type: opts.documentType,
        topic_id: opts.topicId,
        course_id: opts.courseId,
        metadata: JSON.stringify({ tags: opts.tags ?? [] }),
      })
      .select()
      .single();
    if (aErr) throw aErr;
    assignmentId = asgn.id;
  }

  // 2. Validate + prepare each file (resize thumbnails for images).
  const prepared: (ValidatedFile | ValidationError)[] = [];
  for (const f of files) {
    const v = await validateAndPrepare(f);
    prepared.push(v);
    opts.onProgress?.(prepared.filter((p) => 'blob' in p).length, files.length);
  }

  // 3. Upload originals + thumbnails + DB records.
  const docs: DocumentRow[] = [];
  let uploaded = 0;
  for (const v of prepared) {
    if (!('blob' in v)) {
      opts.onProgress?.(uploaded, files.length);
      continue;
    }
    const docId = v.id;
    const originalPath = await uploadBlob(user.id, docId, 'original', v.blob, v.mimeType);
    let thumbnailPath: string | null = null;
    if (v.thumbnailBlob) {
      thumbnailPath = await uploadBlob(user.id, docId, 'thumbnail', v.thumbnailBlob, 'image/jpeg');
    }
    const { document, error: dErr } = await createDocumentRecord({
      userId: user.id,
      originalFilename: v.fileName ?? `upload_${docId}.${v.extension}`,
      storagePath: originalPath,
      thumbnailPath,
      mimeType: v.mimeType,
      extension: v.extension,
      fileSize: v.size,
      width: v.width,
      height: v.height,
      assignmentId,
      documentType: opts.documentType,
      topicId: opts.topicId,
      courseId: opts.courseId,
      subjectId: opts.subjectId,
      tags: opts.tags,
      capturedAt: v.fileName ? undefined : new Date().toISOString(),
    });
    if (dErr || !document) {
      opts.onProgress?.(uploaded, files.length);
      continue;
    }
    docs.push(document);
    uploaded++;
    opts.onProgress?.(uploaded, files.length, document);

    // 4. Queue background processing (OCR + AI classification + summary).
    await supabase.functions.invoke('process-document', { body: { documentId: document.id } }).catch(() => {
      /* processing may still run; the client polls status */
    });
  }

  // 5. Award XP once for this upload batch (idempotent).
  if (docs.length > 0) {
    const xpReason =
      opts.documentType === 'homework'
        ? 'homework_uploaded'
        : opts.documentType === 'classwork'
        ? 'classwork_uploaded'
        : 'homework_uploaded';
    await supabase.rpc('award_xp', {
      p_user: user.id,
      p_amount: 20,
      p_reason: xpReason,
      p_description: `${opts.documentType} uploaded`,
      p_entity_type: 'assignment',
      p_entity_id: assignmentId ?? docs[0].id,
      p_source: 'upload',
      p_transaction_key: `upload:${assignmentId ?? docs[0].id}`,
    });
    await supabase.rpc('check_achievements', { p_user: user.id });
  }

  return { documents: docs, assignmentId };
}

export async function getDownloadUrl(document: DocumentRow, expiresIn = 120) {
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(document.storage_path, expiresIn);
  return { url: data?.signedUrl ?? null, error };
}

