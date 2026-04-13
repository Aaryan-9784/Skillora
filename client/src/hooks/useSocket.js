import { useEffect } from "react";
import { connectSocket, disconnectSocket, getSocket } from "../services/socketService";
import useAuthStore from "../store/authStore";

const useSocket = () => {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      connectSocket();
    } else {
      disconnectSocket();
    }
    // Don't disconnect on unmount — keep alive across routes
  }, [isAuthenticated]);

  return getSocket();
};

export default useSocket;
