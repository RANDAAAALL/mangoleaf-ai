import { Composition } from "remotion";
import { MangoLeafPromo } from "./MangoLeafPromo";

export function RemotionRoot() {
  return (
    <>
      <Composition
        id="MangoLeafPromo"
        component={MangoLeafPromo}
        durationInFrames={1200} // 40 seconds at 30 fps
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
}
