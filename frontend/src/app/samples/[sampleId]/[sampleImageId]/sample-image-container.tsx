import { getUser } from "@/lib/supabase/auth";
import { MetaSampleImage } from "../../types";
import { Room } from "./liveblocks/Room";
import { StorageTldraw } from "./liveblocks/components/StorageTldraw";
import { User } from "@supabase/supabase-js";

interface SampleImageContainerProps {
  currentUser: User;
  sampleImage: MetaSampleImage;
}

const SampleImageContainer = ({
  currentUser,
  sampleImage,
}: SampleImageContainerProps) => {
  return (
    <Room roomId={"liveblocks:sample-edit:" + sampleImage.id}>
      <StorageTldraw currentUser={currentUser} sampleImage={sampleImage} />
    </Room>
  );
};

export default SampleImageContainer;
