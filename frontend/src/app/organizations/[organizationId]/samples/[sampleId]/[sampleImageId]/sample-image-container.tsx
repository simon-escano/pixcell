import { MetaSampleImage } from "../../types";
import { Room } from "./liveblocks/Room";
import { StorageTldraw } from "./liveblocks/components/StorageTldraw";

interface SampleImageContainerProps {
  sampleImage: MetaSampleImage;
  canEdit?: boolean;
}

const SampleImageContainer = ({
  sampleImage,
  canEdit,
}: SampleImageContainerProps) => {

  return (
    <div className="flex flex-col gap-2 h-full w-full">
      {/* Image Display */}
      <Room roomId={"sample-image_" + sampleImage.id}>
        <StorageTldraw sampleImage={sampleImage} canEdit={canEdit} />
      </Room>
    </div>
  );
};

export default SampleImageContainer;
