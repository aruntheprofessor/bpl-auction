'use client';
// Choose an image, shrink it in the browser, upload it, and hand back the link.
import { useRef, useState } from 'react';
import { uploadImage } from '@/lib/api';

export default function ImageField({ label, value, onChange, kind = 'photo' }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function pick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const options = kind === 'logo' ? { maxSize: 400, type: 'image/png' } : { maxSize: 700, type: 'image/jpeg' };
      onChange(await uploadImage(file, options));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  return (
    <div className="field">
      <label>{label}</label>
      <div className="image-field">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="thumb" />
        ) : (
          <div className="thumb thumb-empty">No image</div>
        )}
        <div className="image-buttons">
          <button type="button" className="btn btn-sm" disabled={busy} onClick={() => input.current.click()}>
            {busy ? 'Uploading…' : value ? 'Change image' : 'Choose image'}
          </button>
          {value ? (
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => onChange('')}>
              Remove
            </button>
          ) : null}
          {error ? <div className="error-text">{error}</div> : null}
        </div>
        <input ref={input} type="file" accept="image/*" hidden onChange={pick} />
      </div>
    </div>
  );
}
