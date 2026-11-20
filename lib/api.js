// Helpers for talking to our own server (the /api routes).
export async function callApi(url, method = 'GET', body) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Something went wrong');
  return json;
}

// Every auction click (bid, sold, next player...) goes through this one function.
export const auctionAction = (action, extra = {}) =>
  callApi('/api/auction', 'POST', { action, ...extra });

// Shrinks a photo/logo in the browser before uploading, so uploads are fast and storage stays small.
export async function compressImage(file, maxSize = 700, type = 'image/jpeg') {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Could not read this image'));
      i.src = url;
    });
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, 0.85));
    if (!blob) throw new Error('Could not compress this image');
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function uploadImage(file, { maxSize = 700, type = 'image/jpeg' } = {}) {
  const blob = await compressImage(file, maxSize, type);
  const form = new FormData();
  form.append('file', new File([blob], 'image', { type }));
  const res = await fetch('/api/upload', { method: 'POST', body: form });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Upload failed');
  return json.url;
}
