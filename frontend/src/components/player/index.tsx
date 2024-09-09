import Lottie from "react-lottie-player";
import { PlayerProps } from "./player.types";

function Player({ loop, animationData, style, className }: PlayerProps) {
  return (
    <Lottie
      loop={loop}
      animationData={animationData}
      play
      style={style}
      className={className}
    />
  );
}

export default Player;
