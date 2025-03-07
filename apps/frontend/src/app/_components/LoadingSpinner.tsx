interface LoadingSpinnerProps {
  size?: number; 
}

const LoadingSpinner = ({ size = 48 }: LoadingSpinnerProps) => {
  return (
    <div className="relative flex items-center justify-center mb-6">
      <div 
        className="absolute border-4 border-t-transparent border-white opacity-70 rounded-full animate-spin"
        style={{ width: `${size}px`, height: `${size}px` }}
      ></div>
    </div>
  );
};

export default LoadingSpinner;
