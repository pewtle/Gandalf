import { useState, useEffect, useRef } from 'react';

const SLIDE_MS = 30_000;
const FADE_MS = 900;

export default function Screensaver() {
  const [photos, setPhotos] = useState([]);
  const [currentSrc, setCurrentSrc] = useState('');
  const [visible, setVisible] = useState(true);
  const indexRef = useRef(0);

  useEffect(() => {
    fetch('/api/photos')
      .then(r => r.json())
      .then(list => {
        if (list.length === 0) return;
        // Shuffle so the order isn't always the same after a restart
        const shuffled = [...list].sort(() => Math.random() - 0.5);
        setPhotos(shuffled);
        setCurrentSrc(`/photos/${shuffled[0]}`);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (photos.length < 2) return;

    const id = setInterval(() => {
      // Fade out
      setVisible(false);

      setTimeout(() => {
        indexRef.current = (indexRef.current + 1) % photos.length;
        setCurrentSrc(`/photos/${photos[indexRef.current]}`);
        // Fade in
        setVisible(true);
      }, FADE_MS);
    }, SLIDE_MS);

    return () => clearInterval(id);
  }, [photos]);

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000' }}>
      {currentSrc ? (
        <img
          src={currentSrc}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: visible ? 1 : 0,
            transition: `opacity ${FADE_MS}ms ease-in-out`,
          }}
        />
      ) : (
        // Fallback when no photos are present
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
          }}
        />
      )}
    </div>
  );
}
