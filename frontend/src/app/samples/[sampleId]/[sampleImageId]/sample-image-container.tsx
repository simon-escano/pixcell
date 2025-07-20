import { User } from "@supabase/supabase-js";
import { MetaSampleImage } from "../../types";
import { Room } from "./liveblocks/Room";
import { StorageTldraw } from "./liveblocks/components/StorageTldraw";

interface SampleImageContainerProps {
  currentUser: User;
  sampleImage: MetaSampleImage;
}

const SampleImageContainer = ({
  currentUser,
  sampleImage,
}: SampleImageContainerProps) => {
  return (
    <Room roomId={"sample-image_" + sampleImage.id}>
      <StorageTldraw currentUser={currentUser} sampleImage={sampleImage} />
    </Room>
  );
};

export default SampleImageContainer;
