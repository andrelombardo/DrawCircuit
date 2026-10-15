export function download(contents: string | Blob, filename: string, mime: string): void {
  const blob = contents instanceof Blob ? contents : new Blob([contents], { type: mime }),
    url = URL.createObjectURL(blob),
    a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const fileName = (title: string) =>
  title.replace(/[^a-zA-Z0-9à-ü_-]+/g, '-').replace(/^-|-$/g, '') || 'circuito';
