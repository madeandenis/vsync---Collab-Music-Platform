import { Backdrop } from "./Backdrop";
import LoadingSpinner from "./LoadingSpinner";

interface LoadingOverlayProps
{
  opacity?: number
}

const LoadingOverlay = ({ opacity }: LoadingOverlayProps) => {
  return (
    <Backdrop opacity={opacity}>
      <LoadingSpinner />
    </Backdrop>
  );
};

export default LoadingOverlay;
