export default function LoadingPlayer() {
  return (
    <div className="flex items-center p-2 ml-10">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full border-4 border-t-transparent border-white animate-spin-pulse" />
      </div>
      <style jsx>{`
        .animate-spin-pulse {
          animation: spinPulse 1.5s infinite ease-in-out;
        }
        @keyframes spinPulse {
          0% {
            transform: rotate(0deg);
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            transform: rotate(360deg);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
