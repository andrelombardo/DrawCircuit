import { save, open } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeFile } from '@tauri-apps/plugin-fs';
import { invoke } from '@tauri-apps/api/core';

let dialogPending = false;
async function nativeFileDialog<T>(show: () => Promise<T>): Promise<T | null> {
  if (dialogPending) return null;
  dialogPending = true;
  try {
    await invoke('native_file_dialog', { active: true });
    return await show();
  } finally {
    try {
      await invoke('native_file_dialog', { active: false });
    } finally {
      dialogPending = false;
    }
  }
}

export async function saveNativeFile(contents: string | Blob, filename: string) {
  const extension = filename.split('.').at(-1) ?? 'json';
  const path = await nativeFileDialog(() =>
    save({
      defaultPath: filename,
      filters: [{ name: extension.toUpperCase(), extensions: [extension] }],
    }),
  );
  if (!path) return;
  const bytes =
    contents instanceof Blob
      ? new Uint8Array(await contents.arrayBuffer())
      : new TextEncoder().encode(contents);
  await writeFile(path, bytes);
}
export async function readNativeArchive() {
  const path = await nativeFileDialog(() =>
    open({
      multiple: false,
      filters: [{ name: 'Archivio DrawCircuit', extensions: ['json'] }],
    }),
  );
  return typeof path === 'string' ? readTextFile(path) : null;
}
