import { useContext } from "react";
import styles from "./style.module.scss";
import { AuthContext } from "../../context/auth";
import Player from "../../components/player";
import classNames from "classnames";
import homeLottie from "../../assets/lottie/home_loading_lottie.json";
import homeLogo from "../../assets/logo.webp";

function Home() {
  const { token } = useContext(AuthContext);
  return (
    <div className={styles?.home_container}>
      <div className={styles?.home_loading_lottie}>
        {token === "" ? (
          <Player animationData={homeLottie} loop />
        ) : (
          <div className={styles.home_screen}>
            <p className={styles.title}>BINGO</p>
            <img src={homeLogo} className={styles?.home_image} alt="" />
            <div className={styles.button_container}>
              <button className={classNames(styles.btn, styles.btn_online)}>
                Play Online
              </button>
              <button className={classNames(styles.btn, styles.btn_offline)}>
                Play Offline
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
