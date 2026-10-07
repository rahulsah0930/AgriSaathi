import os
import uuid
import io
import hashlib
from abc import ABC, abstractmethod
from werkzeug.utils import secure_filename
from PIL import Image
from config import Config

ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

CATEGORY_PATHS = {
    'crop_lots': {
        'local_subfolder': 'crop_lots',
        'cloud_folder': 'agrisaathi/lots'
    },
    'commodities': {
        'local_subfolder': 'commodities',
        'cloud_folder': 'agrisaathi/commodities'
    },
    'pod': {
        'local_subfolder': 'pod',
        'cloud_folder': 'agrisaathi/pod'
    },
    'quality': {
        'local_subfolder': 'quality',
        'cloud_folder': 'agrisaathi/quality'
    }
}

def validate_image_stream(file_obj, max_size=MAX_FILE_SIZE_BYTES, custom_filename=None):
    """
    Validates file object for type, size, and corruption without consuming stream permanently.
    Returns (is_valid, error_message, extension, size_in_bytes).
    """
    if not file_obj:
        return False, "No file provided for upload.", None, 0

    orig_name = getattr(file_obj, 'filename', None) or custom_filename
    if not orig_name:
        return False, "No file provided for upload.", None, 0
    if '.' not in orig_name:
        return False, "File lacks an extension.", None, 0

    ext = orig_name.rsplit('.', 1)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return False, f"Unsupported file extension '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}", ext, 0

    # Read bytes to check size
    file_obj.seek(0, os.SEEK_END)
    size = file_obj.tell()
    file_obj.seek(0)

    if size <= 0:
        return False, "File is empty (0 bytes).", ext, 0
    if size > max_size:
        return False, f"File size exceeds maximum allowed limit ({round(max_size / (1024*1024))} MB).", ext, size

    # Verify image integrity with PIL
    try:
        header = file_obj.read(1024)
        file_obj.seek(0)
        is_png = header.startswith(b'\x89PNG\r\n\x1a\n')
        is_jpeg = header.startswith(b'\xff\xd8\xff')
        is_webp = header.startswith(b'RIFF') and b'WEBP' in header[:16]

        try:
            img = Image.open(io.BytesIO(file_obj.read()))
            img.verify()
        except Exception as pil_err:
            file_obj.seek(0)
            return False, f"Corrupted or invalid image stream: {str(pil_err)}", ext, size
        file_obj.seek(0)
    except Exception as e:
        file_obj.seek(0)
        return False, f"Corrupted or invalid image stream: {str(e)}", ext, size

    return True, None, ext, size


class BaseStorageProvider(ABC):
    """Abstract file storage provider interface."""

    @abstractmethod
    def save_file(self, file_obj, category='crop_lots', custom_filename=None) -> dict:
        """Saves a file stream and returns public URL, key, and metadata."""
        pass

    @abstractmethod
    def delete_file(self, storage_key_or_url: str) -> bool:
        """Deletes a file by key or URL if permitted."""
        pass

    @abstractmethod
    def get_public_url(self, storage_key_or_path: str) -> str:
        """Resolves full public URL for given storage key or path."""
        pass

    @abstractmethod
    def get_provider_name(self) -> str:
        """Returns the provider name ('local' or 'cloudinary')."""
        pass


class LocalStorageProvider(BaseStorageProvider):
    """Local filesystem storage provider for frictionless development."""

    def __init__(self, base_upload_dir=None):
        if not base_upload_dir:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            self.base_upload_dir = os.path.join(base_dir, 'uploads')
        else:
            self.base_upload_dir = base_upload_dir
        os.makedirs(self.base_upload_dir, exist_ok=True)

    def get_provider_name(self) -> str:
        return 'local'

    def save_file(self, file_obj, category='crop_lots', custom_filename=None) -> dict:
        cat_info = CATEGORY_PATHS.get(category, CATEGORY_PATHS['crop_lots'])
        target_dir = os.path.join(self.base_upload_dir, cat_info['local_subfolder'])
        os.makedirs(target_dir, exist_ok=True)

        is_valid, err, ext, size = validate_image_stream(file_obj, custom_filename=custom_filename)
        if not is_valid:
            raise ValueError(err)

        if custom_filename:
            filename = secure_filename(custom_filename)
        else:
            filename = f"{category}_{uuid.uuid4().hex[:12]}.{ext}"

        file_path = os.path.join(target_dir, filename)
        file_obj.seek(0)
        if hasattr(file_obj, 'save'):
            file_obj.save(file_path)
        else:
            with open(file_path, 'wb') as f:
                f.write(file_obj.read())

        relative_url = f"/uploads/{cat_info['local_subfolder']}/{filename}"
        storage_key = f"{cat_info['local_subfolder']}/{filename}"

        return {
            'success': True,
            'url': relative_url,
            'storage_key': storage_key,
            'provider': 'local',
            'filename': filename,
            'original_filename': getattr(file_obj, 'filename', None),
            'file_size': size
        }

    def delete_file(self, storage_key_or_url: str) -> bool:
        if not storage_key_or_url:
            return False
        clean_path = storage_key_or_url.replace('/uploads/', '').lstrip('/\\')
        full_path = os.path.join(self.base_upload_dir, clean_path)
        if os.path.isfile(full_path):
            try:
                os.remove(full_path)
                return True
            except OSError:
                return False
        return False

    def get_public_url(self, storage_key_or_path: str) -> str:
        if not storage_key_or_path:
            return ""
        if storage_key_or_path.startswith(('http://', 'https://')):
            return storage_key_or_path
        if storage_key_or_path.startswith('/uploads/'):
            return storage_key_or_path
        return f"/uploads/{storage_key_or_path.lstrip('/')}"


class CloudinaryStorageProvider(BaseStorageProvider):
    """Cloudinary cloud object storage provider for production."""

    def __init__(self, cloud_name=None, api_key=None, api_secret=None):
        self.cloud_name = cloud_name or Config.CLOUDINARY_CLOUD_NAME
        self.api_key = api_key or Config.CLOUDINARY_API_KEY
        self.api_secret = api_secret or Config.CLOUDINARY_API_SECRET

        if not (self.cloud_name and self.api_key and self.api_secret):
            if Config.IS_PRODUCTION:
                raise ValueError(
                    "CloudinaryStorageProvider requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, "
                    "and CLOUDINARY_API_SECRET in production mode."
                )

        import cloudinary
        import cloudinary.uploader
        self._uploader = cloudinary.uploader
        cloudinary.config(
            cloud_name=self.cloud_name,
            api_key=self.api_key,
            api_secret=self.api_secret,
            secure=True
        )

    def get_provider_name(self) -> str:
        return 'cloudinary'

    def save_file(self, file_obj, category='crop_lots', custom_filename=None) -> dict:
        is_valid, err, ext, size = validate_image_stream(file_obj, custom_filename=custom_filename)
        if not is_valid:
            raise ValueError(err)

        cat_info = CATEGORY_PATHS.get(category, CATEGORY_PATHS['crop_lots'])
        folder = cat_info['cloud_folder']

        if custom_filename:
            public_id = os.path.splitext(secure_filename(custom_filename))[0]
        else:
            public_id = f"{category}_{uuid.uuid4().hex[:12]}"

        file_obj.seek(0)
        try:
            result = self._uploader.upload(
                file_obj,
                folder=folder,
                public_id=public_id,
                overwrite=True,
                resource_type='image'
            )
            secure_url = result.get('secure_url')
            storage_key = result.get('public_id')

            return {
                'success': True,
                'url': secure_url,
                'storage_key': storage_key,
                'provider': 'cloudinary',
                'filename': f"{public_id}.{result.get('format', ext)}",
                'original_filename': getattr(file_obj, 'filename', None),
                'file_size': size
            }
        except Exception as e:
            raise RuntimeError(f"Cloudinary upload failed: {str(e)}")

    def delete_file(self, storage_key_or_url: str) -> bool:
        if not storage_key_or_url:
            return False
        # Extract public_id
        public_id = storage_key_or_url
        if 'cloudinary.com' in storage_key_or_url:
            # Extract public_id after upload/v.../
            parts = storage_key_or_url.split('/upload/')
            if len(parts) > 1:
                after_upload = parts[1]
                # remove version if present (v1234567/)
                if after_upload.startswith('v') and '/' in after_upload:
                    after_upload = after_upload.split('/', 1)[1]
                public_id = os.path.splitext(after_upload)[0]
        try:
            res = self._uploader.destroy(public_id)
            return res.get('result') == 'ok'
        except Exception:
            return False

    def get_public_url(self, storage_key_or_path: str) -> str:
        if not storage_key_or_path:
            return ""
        if storage_key_or_path.startswith(('http://', 'https://')):
            return storage_key_or_path
        return f"https://res.cloudinary.com/{self.cloud_name}/image/upload/{storage_key_or_path}"


_STORAGE_INSTANCE = None

def get_storage_provider(provider_type=None) -> BaseStorageProvider:
    """
    Factory method returning the active storage provider singleton.
    In development defaults to LocalStorageProvider.
    In production defaults to CloudinaryStorageProvider if configured.
    """
    global _STORAGE_INSTANCE
    target_type = (provider_type or Config.STORAGE_PROVIDER).lower()

    if _STORAGE_INSTANCE is None or _STORAGE_INSTANCE.get_provider_name() != target_type:
        if target_type == 'cloudinary':
            _STORAGE_INSTANCE = CloudinaryStorageProvider()
        else:
            _STORAGE_INSTANCE = LocalStorageProvider()

    return _STORAGE_INSTANCE
