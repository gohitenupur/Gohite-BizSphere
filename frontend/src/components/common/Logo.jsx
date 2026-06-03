export default function Logo({ variant = 'header', className = '' }) {
  const src = variant === 'login' ? '/logos/gohite-login.png' : '/logos/gohite-bizsphere.png';
  const size = variant === 'login' ? 'w-32 h-auto' : 'w-10 h-10';
  return <img src={src} alt="Gohite BizSphere" className={`object-contain ${size} ${className}`} />;
}
