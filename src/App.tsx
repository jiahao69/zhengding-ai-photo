import { useCallback, useEffect, useState } from "react";

import GestureController from "@/components/GestureController";
import { usePageAudio } from "@/hooks";
import openJourneyAudio from "@/assets/audios/home-intro.mp3";
import alignFaceAudio from "@/assets/audios/photograph-tip.mp3";
import selectGenderAudio from "@/assets/audios/select-gender-tip.mp3";
import selectClothesAudio from "@/assets/audios/select-clothes-tip.mp3";
import zjgAudio from "@/assets/audios/zjg-tip.mp3";
import lqxAudio from "@/assets/audios/lqx-tip.mp3";

import Home from "@/pages/Home";
import Photograph from "@/pages/Photograph";
import SelectGender from "@/pages/SelectGender";
import SelectClothes from "@/pages/SelectClothes";
import Zjg from "@/pages/Zjg";
import Lqx from "@/pages/Lqx";
import ChangChengLoading from "@/pages/ChangChengLoading";
import TransformationResults from "@/pages/TransformationResults";
import { requestFaceSwap, uploadImage } from "@/service/api";
import { sourceToDataURL } from "@/utils/source-to-dataurl";
import { getThemeFromSearch } from "@/utils/theme-assets";

type PageKey =
  | "home"
  | "photograph"
  | "gender"
  | "clothes"
  | "changchengLoading"
  | "zjg"
  | "lqx"
  | "results";

const pageAudioMap: Record<PageKey, string> = {
  home: openJourneyAudio,
  photograph: alignFaceAudio,
  gender: selectGenderAudio,
  clothes: selectClothesAudio,
  changchengLoading: "",
  zjg: zjgAudio,
  lqx: lqxAudio,
  results: "",
};

function App() {
  const currentTheme = getThemeFromSearch();
  const [page, setPage] = useState<PageKey>("home");
  const [capturedPhotoDataUrl, setCapturedPhotoDataUrl] = useState("");
  const [selectedGender, setSelectedGender] = useState<"male" | "female" | "">(
    "",
  );
  const [swapResultImageUrl, setSwapResultImageUrl] = useState("");
  const [uploadedResultUrl, setUploadedResultUrl] = useState("");
  const [isGeneratingSwap, setIsGeneratingSwap] = useState(false);
  const [lqxNextRequested, setLqxNextRequested] = useState(false);

  usePageAudio({ src: pageAudioMap[page] });

  const startSwapGeneration = useCallback(
    async (faceImageUrl: string, swapImageUrl: string) => {
      if (!faceImageUrl || !swapImageUrl) {
        return;
      }

      setIsGeneratingSwap(true);
      setUploadedResultUrl("");
      setSwapResultImageUrl("");

      try {
        const resultImageUrl = await requestFaceSwap(
          faceImageUrl,
          swapImageUrl,
        );

        setSwapResultImageUrl(resultImageUrl);

        try {
          const dataURL = await sourceToDataURL(resultImageUrl);
          const payload = await uploadImage(
            `swap-result-${Date.now()}`,
            dataURL,
          );
          setUploadedResultUrl(payload.value || "");
        } catch (error) {
          console.warn("上传换装结果失败:", error);
        }
      } finally {
        setIsGeneratingSwap(false);
      }
    },
    [],
  );

  const resetFlowState = () => {
    setCapturedPhotoDataUrl("");
    setSelectedGender("");

    setIsGeneratingSwap(false);
    setLqxNextRequested(false);

    setUploadedResultUrl("");
    setSwapResultImageUrl("");
  };

  const handleOpenPhotograph = () => {
    resetFlowState();
    setPage("photograph");
  };

  const handlePhotographRetake = () => {
    setCapturedPhotoDataUrl("");
  };

  const handlePhotographConfirm = (photoDataUrl: string) => {
    setCapturedPhotoDataUrl(photoDataUrl);
    setPage("gender");
  };

  const handleGenderSelect = (gender: "male" | "female") => {
    setSelectedGender(gender);
    setPage("clothes");
  };

  const handleClothesConfirm = (swapImage: string) => {
    setLqxNextRequested(false);
    setPage(currentTheme === "changcheng" ? "changchengLoading" : "zjg");
    startSwapGeneration(capturedPhotoDataUrl, swapImage);
  };

  const handleZjgNext = () => {
    setLqxNextRequested(false);
    setPage("lqx");
  };

  const handleLqxNext = () => {
    if (!swapResultImageUrl) {
      setLqxNextRequested(true);
      return;
    }

    setLqxNextRequested(false);
    setPage("results");
  };

  useEffect(() => {
    if (page !== "lqx" || !lqxNextRequested || !swapResultImageUrl) {
      return;
    }

    setLqxNextRequested(false);
    setPage("results");
  }, [lqxNextRequested, page, swapResultImageUrl]);

  useEffect(() => {
    if (page !== "changchengLoading" || !swapResultImageUrl) {
      return;
    }

    setPage("results");
  }, [page, swapResultImageUrl]);

  return (
    <>
      {page === "home" && <Home onOpen={handleOpenPhotograph} />}

      {page === "photograph" && (
        <Photograph
          savedPhotoDataUrl={capturedPhotoDataUrl}
          onRetake={handlePhotographRetake}
          onConfirm={handlePhotographConfirm}
        />
      )}

      {page === "gender" && (
        <SelectGender
          onSelect={handleGenderSelect}
          onBack={() => setPage("photograph")}
        />
      )}

      {page === "clothes" && (
        <SelectClothes
          selectedGender={selectedGender}
          onBack={() => setPage("gender")}
          onConfirm={handleClothesConfirm}
        />
      )}

      {page === "changchengLoading" && <ChangChengLoading />}

      {page === "zjg" && <Zjg onNext={handleZjgNext} />}

      {page === "lqx" && (
        <Lqx
          isGenerating={lqxNextRequested && isGeneratingSwap}
          onNext={handleLqxNext}
        />
      )}

      {page === "results" && (
        <TransformationResults
          resultImageUrl={swapResultImageUrl}
          uploadedResultUrl={uploadedResultUrl}
          onBack={() => setPage("home")}
        />
      )}

      <GestureController />
    </>
  );
}

export default App;
