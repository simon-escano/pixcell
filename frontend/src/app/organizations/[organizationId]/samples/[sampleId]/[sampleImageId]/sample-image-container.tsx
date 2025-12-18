import { MetaSampleImage } from "../../types";
import { Room } from "./liveblocks/Room";
import { StorageTldraw } from "./liveblocks/components/StorageTldraw";

interface SampleImageContainerProps {
  sampleImage: MetaSampleImage;
  canEdit?: boolean;
  aiImageUrl?: string | null;
  showAiImage?: boolean;
  onShowAiImageChange?: (show: boolean) => void;
}

const SampleImageContainer = ({
  sampleImage,
  canEdit,
  aiImageUrl,
  showAiImage,
  onShowAiImageChange,
}: SampleImageContainerProps) => {

  return (
    <div className="flex flex-col gap-2 h-full w-full">
      {/* Image Display */}
      <Room roomId={"sample-image_" + sampleImage.id}>
        <StorageTldraw 
          sampleImage={sampleImage} 
          canEdit={canEdit}
          aiImageUrl={aiImageUrl}
          showAiImage={showAiImage}
          onShowAiImageChange={onShowAiImageChange}
        />
      </Room>
    </div>
  );
};

export default SampleImageContainer;
