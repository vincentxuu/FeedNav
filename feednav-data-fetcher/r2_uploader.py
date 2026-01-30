"""
Cloudflare R2 圖片上傳器

使用 boto3 (S3 相容 API) 將圖片上傳到 Cloudflare R2。
"""
from __future__ import annotations

import logging
import os
from typing import TYPE_CHECKING

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

if TYPE_CHECKING:
    from mypy_boto3_s3 import S3Client

logger = logging.getLogger(__name__)


class R2UploaderError(Exception):
    """R2 上傳相關錯誤"""


class R2Uploader:
    """Cloudflare R2 圖片上傳器"""

    def __init__(self) -> None:
        """
        初始化 R2 上傳器

        需要以下環境變數：
        - R2_ACCOUNT_ID: Cloudflare 帳號 ID
        - R2_ACCESS_KEY_ID: R2 API Token 的 Access Key ID
        - R2_SECRET_ACCESS_KEY: R2 API Token 的 Secret Access Key
        - R2_BUCKET_NAME: R2 bucket 名稱 (預設: feednav-storage)
        - R2_PUBLIC_URL: R2 公開存取 URL (預設: https://storage.feednav.cc)
        """
        self._validate_env_vars()

        account_id = os.environ['R2_ACCOUNT_ID']
        self.bucket = os.environ.get('R2_BUCKET_NAME', 'feednav-storage')
        self.public_url = os.environ.get(
            'R2_PUBLIC_URL', 'https://storage.feednav.cc'
        ).rstrip('/')

        # 建立 S3 相容客戶端
        self.client: S3Client = boto3.client(
            's3',
            endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
            aws_access_key_id=os.environ['R2_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['R2_SECRET_ACCESS_KEY'],
            config=Config(
                signature_version='s3v4',
                retries={'max_attempts': 3, 'mode': 'standard'}
            ),
            region_name='auto'
        )

        self._enabled = True
        logger.info(f"R2 上傳器已初始化 (bucket: {self.bucket})")

    def _validate_env_vars(self) -> None:
        """驗證必要的環境變數"""
        required_vars = [
            'R2_ACCOUNT_ID',
            'R2_ACCESS_KEY_ID',
            'R2_SECRET_ACCESS_KEY'
        ]
        missing = [var for var in required_vars if not os.environ.get(var)]
        if missing:
            raise R2UploaderError(
                f"缺少必要的環境變數: {', '.join(missing)}"
            )

    @property
    def enabled(self) -> bool:
        """是否啟用 R2 上傳"""
        return self._enabled

    def upload_image(
        self,
        image_data: bytes,
        place_id: str,
        index: int
    ) -> str:
        """
        上傳圖片到 R2

        Args:
            image_data: 圖片二進位資料
            place_id: Google Places API 的 place_id
            index: 圖片索引 (從 0 開始)

        Returns:
            圖片的公開 URL

        Raises:
            R2UploaderError: 上傳失敗時
        """
        # 使用 place_id 和 index 作為檔案路徑
        key = f"photos/{place_id}/{index}.jpg"

        try:
            self.client.put_object(
                Bucket=self.bucket,
                Key=key,
                Body=image_data,
                ContentType='image/jpeg',
                CacheControl='public, max-age=31536000'  # 快取 1 年
            )
            url = f"{self.public_url}/{key}"
            logger.debug(f"圖片已上傳: {url}")
            return url

        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            raise R2UploaderError(
                f"上傳失敗 (place_id: {place_id}, index: {index}): {error_code}"
            ) from e

    def check_exists(self, place_id: str, index: int) -> bool:
        """
        檢查圖片是否已存在

        Args:
            place_id: Google Places API 的 place_id
            index: 圖片索引

        Returns:
            圖片是否存在
        """
        key = f"photos/{place_id}/{index}.jpg"

        try:
            self.client.head_object(Bucket=self.bucket, Key=key)
            return True
        except ClientError as e:
            if e.response.get('Error', {}).get('Code') == '404':
                return False
            raise R2UploaderError(
                f"檢查檔案失敗 (place_id: {place_id}, index: {index})"
            ) from e

    def get_public_url(self, place_id: str, index: int) -> str:
        """
        取得圖片的公開 URL (不檢查是否存在)

        Args:
            place_id: Google Places API 的 place_id
            index: 圖片索引

        Returns:
            圖片的公開 URL
        """
        return f"{self.public_url}/photos/{place_id}/{index}.jpg"


def create_r2_uploader() -> R2Uploader | None:
    """
    建立 R2 上傳器，如果環境變數未設定則返回 None

    Returns:
        R2Uploader 實例，或 None (如果環境變數未設定)
    """
    required_vars = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY']

    if not all(os.environ.get(var) for var in required_vars):
        logger.warning(
            "R2 環境變數未設定，圖片上傳功能停用。"
            "將使用 photo_reference 格式。"
        )
        return None

    try:
        return R2Uploader()
    except R2UploaderError as e:
        logger.error(f"R2 上傳器初始化失敗: {e}")
        return None
