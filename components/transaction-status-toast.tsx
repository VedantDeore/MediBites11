import { toast } from 'react-hot-toast';

export const showBlockchainStatus = () => {
  const toastId = toast.loading(
    <div className="flex flex-col space-y-1">
      <div className="flex items-center space-x-2">
        <span className="animate-pulse">⛏️</span>
        <span>Processing blockchain transaction...</span>
      </div>
      <div className="text-sm text-muted-foreground">
        This may take a few moments
      </div>
    </div>
  );

  return {
    success: () => {
      toast.success(
        <div className="flex flex-col space-y-1">
          <div className="flex items-center space-x-2">
            <span>✨</span>
            <span>Transaction confirmed on blockchain</span>
          </div>
        </div>,
        { id: toastId }
      );
    },
    error: (message: string) => {
      toast.error(
        <div className="flex flex-col space-y-1">
          <div className="flex items-center space-x-2">
            <span>❌</span>
            <span>Blockchain error: {message}</span>
          </div>
        </div>,
        { id: toastId }
      );
    }
  };
}; 