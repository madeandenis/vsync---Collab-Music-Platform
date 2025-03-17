import { Backdrop } from "./Backdrop";
import Spinner from "./Spinner";

interface LoadingOverlayProps
{
  opacity?: number
}

const LoadingOverlay = ({ opacity }: LoadingOverlayProps) => {
  return (
    <Backdrop opacity={opacity}>
      <Spinner />
    </Backdrop>
  );
};

export default LoadingOverlay;
