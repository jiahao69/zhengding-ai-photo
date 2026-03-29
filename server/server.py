import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from face_swap_core import FaceSwapCore

MAX_UPLOAD_MB = 10
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
ALLOWED_TYPES = {"image/jpeg", "image/png"}

app = FastAPI()
core = FaceSwapCore()

# 允许 H5 跨域调用 (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


async def read_image(upload: UploadFile, field_name: str):
    if upload.content_type and upload.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=415, detail=f"{field_name} 图片类型不支持")

    data = await upload.read()
    if not data:
        raise HTTPException(status_code=400, detail=f"{field_name} 文件为空")

    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"{field_name} 文件过大，限制 {MAX_UPLOAD_MB}MB",
        )

    image = cv2.imdecode(np.frombuffer(data, dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None or image.size == 0:
        raise HTTPException(status_code=400, detail=f"{field_name} 不是有效图片")

    return image


@app.post("/face-swap")
async def swap_face(source: UploadFile = File(...), target: UploadFile = File(...)):
    try:
        source_image = await read_image(source, "source")
        target_image = await read_image(target, "target")
    finally:
        await source.close()
        await target.close()

    try:
        result_image, err = core.process(source_image, target_image)
    except Exception as exc:
        raise HTTPException(status_code=500, detail="换脸失败") from exc

    if err:
        status = 422 if err == "未检测到人脸" else 500
        raise HTTPException(status_code=status, detail=err)

    ok, encoded_image = cv2.imencode(".jpg", result_image)
    if not ok:
        raise HTTPException(status_code=500, detail="图片编码失败")

    return Response(content=encoded_image.tobytes(), media_type="image/jpeg")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
