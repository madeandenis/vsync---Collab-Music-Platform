export default function Spinner({ size = 48 }: { size?: number }) {
  return (
    <div 
      className="border-2 border-white/50 border-solid border-t-transparent rounded-full animate-spin"
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
}
