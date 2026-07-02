'use client';

import React, { useState } from 'react';

/**
 * The Surcal brand lockup: the circle mark (/public/mark.png) followed by the
 * "Surcal" wordmark text. If the mark image is missing it degrades to just the
 * text, so the brand never disappears.
 *
 * To change the mark: replace `public/mark.png`. To restyle the text, pass
 * `textStyle`. `height` controls the mark size (the text scales independently).
 */
export default function Logo({
  height = 30,
  textStyle,
}: {
  height?: number;
  textStyle?: React.CSSProperties;
}) {
  const [markFailed, setMarkFailed] = useState(false);

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem' }}>
      {!markFailed && (
        // eslint-disable-next-line @next/next/no-img-element -- plain img so we can fall back on 404
        <img
          src="/mark.png"
          alt=""
          aria-hidden="true"
          onError={() => setMarkFailed(true)}
          style={{ height, width: 'auto', display: 'block', borderRadius: '7px' }}
        />
      )}
      <span style={textStyle}>Surcal</span>
    </span>
  );
}
