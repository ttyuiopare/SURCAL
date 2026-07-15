import { ImageResponse } from 'next/og';

// Site-wide default social share card (1200×630). Next.js applies this to
// og:image AND twitter:image for every route that doesn't define its own.
// Rendered from the Surcal brand gradient — no external asset required.

export const alt = 'Surcal — Post what you want. Sellers compete.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '90px',
          background: 'linear-gradient(135deg, #E5007D 0%, #8B5CF6 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 46, fontWeight: 700, letterSpacing: '-1px', opacity: 0.95 }}>
          Surcal
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 84,
            fontWeight: 800,
            lineHeight: 1.05,
            marginTop: 28,
            letterSpacing: '-2px',
            maxWidth: 900,
          }}
        >
          Post what you want. Sellers compete.
        </div>
        <div style={{ display: 'flex', fontSize: 36, marginTop: 32, opacity: 0.92, maxWidth: 860 }}>
          Verified sellers send you competing offers — escrow-protected, free to post.
        </div>
      </div>
    ),
    { ...size }
  );
}
