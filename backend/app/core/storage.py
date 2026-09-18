import os
import uuid
import shutil
import mimetypes
import logging
import httpx
from fastapi import UploadFile
from app.core.config import settings

logger = logging.getLogger(__name__)

STATIC_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "static")
)


class StorageService:
    """Service to handle file uploads either to Supabase Cloud Storage or local disk fallback."""

    def __init__(self):
        self.supabase_url = (
            settings.SUPABASE_URL.rstrip("/") if settings.SUPABASE_URL else None
        )
        self.supabase_key = settings.SUPABASE_KEY
        self.bucket = settings.SUPABASE_STORAGE_BUCKET or "knots-media"

    async def ensure_bucket_exists(self):
        """Ensure the public storage bucket exists in Supabase if credentials are provided."""
        if not self.supabase_url or not self.supabase_key:
            return

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                headers = {
                    "Authorization": f"Bearer {self.supabase_key}",
                    "apiKey": self.supabase_key,
                    "Content-Type": "application/json",
                }
                # Check if bucket exists
                res = await client.get(
                    f"{self.supabase_url}/storage/v1/bucket/{self.bucket}",
                    headers=headers,
                )
                if res.status_code == 404:
                    # Create bucket as public
                    create_payload = {
                        "id": self.bucket,
                        "name": self.bucket,
                        "public": True,
                    }
                    create_res = await client.post(
                        f"{self.supabase_url}/storage/v1/bucket",
                        headers=headers,
                        json=create_payload,
                    )
                    if create_res.status_code in (200, 201):
                        logger.info(
                            f"Created Supabase public bucket '{self.bucket}' successfully."
                        )
        except Exception as e:
            logger.warning(f"Could not verify/create Supabase bucket: {e}")

    async def upload_file(self, file: UploadFile, folder: str = "posts") -> str:
        """
        Uploads a file to Supabase Storage if configured; otherwise saves to local static directory.
        Returns the public URL (https://... or /static/...).
        """
        file_ext = os.path.splitext(file.filename or "")[1].lower()
        if not file_ext:
            content_type = file.content_type or ""
            file_ext = mimetypes.guess_extension(content_type) or ".bin"

        filename = f"{uuid.uuid4()}{file_ext}"
        storage_path = f"{folder}/{filename}"

        # 1. Try Supabase Cloud Storage if credentials are present
        if self.supabase_url and self.supabase_key:
            try:
                content = await file.read()
                content_type = (
                    file.content_type
                    or mimetypes.guess_type(filename)[0]
                    or "application/octet-stream"
                )

                upload_url = f"{self.supabase_url}/storage/v1/object/{self.bucket}/{storage_path}"
                headers = {
                    "Authorization": f"Bearer {self.supabase_key}",
                    "apiKey": self.supabase_key,
                    "Content-Type": content_type,
                    "x-upsert": "true",
                }

                async with httpx.AsyncClient(timeout=30) as client:
                    res = await client.post(
                        upload_url, headers=headers, content=content
                    )

                    if res.status_code in (200, 201):
                        public_url = f"{self.supabase_url}/storage/v1/object/public/{self.bucket}/{storage_path}"
                        logger.info(f"File uploaded to Supabase Storage: {public_url}")
                        return public_url
                    else:
                        logger.warning(
                            f"Supabase storage upload failed with status {res.status_code}: {res.text}. Falling back to local storage."
                        )
            except Exception as e:
                logger.warning(
                    f"Error uploading to Supabase Storage: {e}. Falling back to local storage."
                )
            finally:
                await file.seek(0)

        # 2. Local disk fallback
        local_folder = os.path.join(STATIC_DIR, folder)
        os.makedirs(local_folder, exist_ok=True)
        file_path = os.path.join(local_folder, filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return f"/static/{folder}/{filename}"


storage_service = StorageService()
