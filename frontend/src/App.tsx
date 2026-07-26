import "./App.css";
import AuthManager from "./context/auth";
import SocketManager from "./context/socket";
import GameManager from "./context/game";
import AppRouter from "./router/appRouter";

function App() {
  return (
    <AuthManager>
      <SocketManager>
        <GameManager>
          <AppRouter />
        </GameManager>
      </SocketManager>
    </AuthManager>
  );
}

export default App;
