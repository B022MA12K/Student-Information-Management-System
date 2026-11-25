import { initials } from '../utils.js';

// size: "sm" | "md" (round) or "portrait" (ID-photo rectangle)
export default function Avatar({ src, name, size = 'md' }) {
  return src ? (
    <img className={`avatar ${size}`} src={src} alt={size === 'portrait' ? `Photo of ${name}` : ''} />
  ) : (
    <span className={`avatar ${size}`} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
