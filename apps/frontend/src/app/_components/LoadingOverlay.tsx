import { Backdrop } from "./Backdrop";
import Spinner from "./Spinner";

interface LoadingOverlayProps {
  opacity?: number;
  message?: string;
}

const LoadingOverlay = ({ opacity = 0.7, message }: LoadingOverlayProps) => {
  return (
    <Backdrop opacity={opacity}>
      <div className="flex flex-col items-center gap-4 text-white">
        <Spinner />
        {message && <p className="text-sm text-white/80">{message}</p>}
      </div>
    </Backdrop>
  );
};

export default LoadingOverlay;
