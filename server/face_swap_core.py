import insightface
from insightface.app import FaceAnalysis

class FaceSwapCore:
    def __init__(self):
        providers = ["CPUExecutionProvider"]
        self.app = FaceAnalysis(name="buffalo_l", root="./", providers=providers)
        self.app.prepare(ctx_id=0, det_thresh=0.5, det_size=(640, 640))
        self.swapper = insightface.model_zoo.get_model(
            name="models/inswapper_128.onnx", providers=providers
        )

    def process(self, source_image, target_image):
        source_faces = self.app.get(source_image)
        target_faces = self.app.get(target_image)

        if not source_faces or not target_faces:
            return None, "未检测到人脸"

        result_image = self.swapper.get(
            img=target_image,
            target_face=target_faces[0],
            source_face=source_faces[0],
            paste_back=True,
        )

        return result_image, None
