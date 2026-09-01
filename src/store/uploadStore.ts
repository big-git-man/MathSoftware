import { create } from 'zustand';
import type { UploadableFile } from '../services/upload';

export type UploadFile = UploadableFile & { id: string; local?: boolean };

export interface UploadState {
  files: UploadFile[];
  addFile: (file: UploadFile) => void;
  addFiles: (files: UploadFile[]) => void;
  removeFile: (id: string) => void;
  clear: () => void;
}

export const useUploadStore = create<UploadState>()((set) => ({
  files: [],
  addFile: (file) => set((s) => ({ files: [file, ...s.files] })),
  addFiles: (files) => set((s) => ({ files: [...files, ...s.files] })),
  removeFile: (id) => set((s) => ({ files: s.files.filter((f) => f.id !== id) })),
  clear: () => set({ files: [] }),
}));
