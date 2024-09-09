import { useEffect, useState } from "react";
import { guestLogin } from "../../services/login/login.service";
import { GuestLoginResponse, HomeState } from "./home.types";
import { setItemInLocalStorage } from "../../helpers/localstorage";
import homeLoadingLottie from "../../assets/lottie/home_loading_lottie.json";
import Player from "../../components/player";
import styles from "./style.module.scss";

function Home() {
  const [homeState, setHomeState] = useState<HomeState>({
    isLoading: true,
    isError: false,
  });
  async function fetchGuestUserToken() {
    const response = await guestLogin();
    console.log("response is ", response);
    if (response.isError) {
      setHomeState({
        isLoading: false,
        isError: true,
      });
      return;
    }
    setHomeState({
      isLoading: true,
      isError: false,
    });
    const data = response.data as GuestLoginResponse;
    setItemInLocalStorage("token", data.token);
    setItemInLocalStorage("userId", data.userId);
  }
  useEffect(() => {
    fetchGuestUserToken();
  });
  return (
    <div className={styles?.home_container}>
      <div className={styles?.home_loading_lottie}>
        {homeState.isLoading ? (
          <Player loop animationData={homeLoadingLottie} />
        ) : null}
      </div>
    </div>
  );
}

export default Home;
