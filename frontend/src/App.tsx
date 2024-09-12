import "./App.css";
import AuthManager from "./context/auth";
import SocketManager from "./context/socket";
import AppRouter from "./router/appRouter";

function App() {
  return (
    <AuthManager>
      <SocketManager>
        <AppRouter />
      </SocketManager>
    </AuthManager>
  );
}

export default App;
