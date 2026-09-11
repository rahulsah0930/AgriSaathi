import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Star,
  AlertCircle,
  CheckCircle2,
  Camera,
  Loader2,
  X,
} from 'lucide-react';
import { Button } from './';
import { api, getImageUrl } from '../../services/api';

const MAX_IMAGES = 5;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

export const CropImageUploader = ({
  images = [],
  onChange,
  lotId = null,
  readOnly = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFiles = async (fileList) => {
    setErrorMessage('');
    if (!fileList || fileList.length === 0) {
      return;
    }

    const files = Array.from(fileList);

    // Check maximum image limit
    if (images.length + files.length > MAX_IMAGES) {
      setErrorMessage('You can upload a maximum of 5 photos.');
      return;
    }

    // Validate each file
    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setErrorMessage('Only JPG, PNG and WEBP images are supported.');
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setErrorMessage('Image must be smaller than 5 MB.');
        return;
      }
    }

    setIsUploading(true);
    setUploadProgressText(`Uploading ${files.length} photo${files.length > 1 ? 's' : ''}...`);

    try {
      if (lotId) {
        // Direct upload to existing lot
        const formData = new FormData();
        files.forEach((f) => formData.append('images', f));
        if (images.length === 0) formData.append('is_primary', 'true');

        const result = await api.upload(`/api/lots/${lotId}/images`, formData);
        if (result.images && onChange) {
          onChange(result.images);
        }
      } else {
        // Standalone upload for new produce lot
        const formData = new FormData();
        files.forEach((f) => formData.append('images', f));
        if (images.length === 0) formData.append('is_primary', 'true');

        const result = await api.upload('/api/lots/upload-image', formData);
        if (result.files && onChange) {
          const newItems = result.files.map((f, idx) => ({
            image_url: f.image_url,
            is_primary: images.length === 0 && idx === 0,
            original_name: f.original_name || f.filename,
          }));
          const updated = [...images, ...newItems].slice(0, MAX_IMAGES);
          // Ensure at least one is primary
          if (!updated.some((img) => img.is_primary) && updated.length > 0) {
            updated[0].is_primary = true;
          }
          onChange(updated);
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to upload photo. Please check your connection and try again.');
    } finally {
      setIsUploading(false);
      setUploadProgressText('');
      if (galleryInputRef.current) galleryInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleSetPrimary = async (targetIdx) => {
    const targetImage = images[targetIdx];
    if (!targetImage) return;

    if (lotId && targetImage.id) {
      try {
        await api.patch(`/api/lots/${lotId}/images/${targetImage.id}/primary`, {});
      } catch (err) {
        setErrorMessage(err.message || 'Could not update primary image.');
        return;
      }
    }

    const updated = images.map((img, idx) => ({
      ...img,
      is_primary: idx === targetIdx,
    }));
    onChange && onChange(updated);
  };

  const handleDelete = async (targetIdx) => {
    const targetImage = images[targetIdx];
    if (!targetImage) return;

    if (lotId && targetImage.id) {
      try {
        const res = await api.delete(`/api/lots/${lotId}/images/${targetImage.id}`);
        if (res.images && onChange) {
          onChange(res.images);
          return;
        }
      } catch (err) {
        setErrorMessage(err.message || 'Could not delete image.');
        return;
      }
    }

    const updated = images.filter((_, idx) => idx !== targetIdx);
    if (targetImage.is_primary && updated.length > 0) {
      updated[0].is_primary = true;
    }
    onChange && onChange(updated);
  };

  const isFull = images.length >= MAX_IMAGES;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Hidden File Inputs */}
      {/* 1. Gallery Input (Multiple select, JPG/PNG/WEBP) */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
        disabled={isUploading || readOnly || isFull}
      />

      {/* 2. Camera Input (Mobile capture with rear environment camera, falls back on desktop) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
        disabled={isUploading || readOnly || isFull}
      />

      {/* Produce Photo Guidelines Banner */}
      <div
        style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '10px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        <div
          style={{
            backgroundColor: '#dcfce7',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '2px',
          }}
        >
          <Camera size={18} color="#15803d" />
        </div>
        <div style={{ fontSize: '0.84rem', color: '#166534', lineHeight: 1.5 }}>
          <strong>Produce Photo Guidelines:</strong> Upload real, honest photos of your actual lot.
          <div
            style={{
              marginTop: '4px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px 12px',
              color: '#334155',
              fontSize: '0.82rem',
            }}
          >
            <span>① Overall batch/heap</span>
            <span>•</span>
            <span>② Close-up sample</span>
            <span>•</span>
            <span>③ Cut cross-section or defect view</span>
            <span>•</span>
            <span>④ Packaging/Crates</span>
          </div>
        </div>
      </div>

      {/* Action Buttons: Gallery & Camera */}
      {!readOnly && !isFull && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
          }}
        >
          {/* Upload from Gallery Button */}
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={isUploading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '12px 18px',
              backgroundColor: '#ffffff',
              border: '1.5px solid #16a34a',
              borderRadius: '10px',
              color: '#15803d',
              fontSize: '0.92rem',
              fontWeight: 600,
              cursor: isUploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
            onMouseOver={(e) => {
              if (!isUploading) e.currentTarget.style.backgroundColor = '#f0fdf4';
            }}
            onMouseOut={(e) => {
              if (!isUploading) e.currentTarget.style.backgroundColor = '#ffffff';
            }}
          >
            <ImageIcon size={19} color="#16a34a" />
            <span>Upload from Gallery</span>
          </button>

          {/* Take Photo (Camera) Button */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isUploading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '12px 18px',
              backgroundColor: '#ffffff',
              border: '1.5px solid #2563eb',
              borderRadius: '10px',
              color: '#1d4ed8',
              fontSize: '0.92rem',
              fontWeight: 600,
              cursor: isUploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
            onMouseOver={(e) => {
              if (!isUploading) e.currentTarget.style.backgroundColor = '#eff6ff';
            }}
            onMouseOut={(e) => {
              if (!isUploading) e.currentTarget.style.backgroundColor = '#ffffff';
            }}
          >
            <Camera size={19} color="#2563eb" />
            <span>Take Photo (Camera)</span>
          </button>
        </div>
      )}

      {/* "or" Divider */}
      {!readOnly && !isFull && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: '2px 0',
          }}
        >
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
          <span style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'lowercase', fontWeight: 500 }}>or</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
        </div>
      )}

      {/* Drag & Drop Box */}
      {!readOnly && !isFull && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => galleryInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragActive ? '#16a34a' : '#cbd5e1'}`,
            backgroundColor: dragActive ? 'rgba(22, 163, 74, 0.05)' : '#ffffff',
            borderRadius: '12px',
            padding: '24px 16px',
            textAlign: 'center',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => {
            if (!isUploading && !dragActive) e.currentTarget.style.borderColor = '#94a3b8';
          }}
          onMouseOut={(e) => {
            if (!isUploading && !dragActive) e.currentTarget.style.borderColor = '#cbd5e1';
          }}
        >
          {isUploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Loader2 size={32} className="animate-spin" color="#16a34a" />
              <span style={{ fontSize: '0.9rem', color: '#15803d', fontWeight: 600 }}>
                {uploadProgressText || 'Uploading produce photos...'}
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: '#f0fdf4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '4px',
                }}
              >
                <UploadCloud size={24} color="#16a34a" />
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#1e293b' }}>
                Click to browse or drag & drop images here
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Supports JPG, PNG, WEBP up to 5MB each (Max 5 photos)
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Message Display */}
      {errorMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '0.85rem',
            color: '#b91c1c',
          }}
        >
          <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Selected Photos Preview Thumbnails */}
      {images.length > 0 && (
        <div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
              gap: '12px',
            }}
          >
            {images.map((img, idx) => {
              const rawUrl = typeof img === 'string' ? img : img.image_url;
              const fullUrl = getImageUrl(rawUrl);
              const isPrimary = typeof img === 'object' ? !!img.is_primary : idx === 0;

              return (
                <div
                  key={rawUrl || idx}
                  style={{
                    position: 'relative',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: isPrimary ? '2px solid #16a34a' : '1px solid #e2e8f0',
                    boxShadow: isPrimary ? '0 0 0 2px rgba(22, 163, 74, 0.2)' : '0 1px 3px rgba(0,0,0,0.06)',
                    backgroundColor: '#f8fafc',
                    aspectRatio: '1 / 1',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <img
                    src={fullUrl}
                    alt={`Produce photo ${idx + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80';
                    }}
                  />

                  {/* Primary Badge or Make Primary Button */}
                  {isPrimary ? (
                    <div
                      style={{
                        position: 'absolute',
                        top: '6px',
                        left: '6px',
                        backgroundColor: '#16a34a',
                        color: '#ffffff',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                      }}
                    >
                      <Star size={10} fill="#ffffff" /> Primary
                    </div>
                  ) : (
                    !readOnly && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(idx)}
                        title="Set as primary photo"
                        style={{
                          position: 'absolute',
                          top: '6px',
                          left: '6px',
                          backgroundColor: 'rgba(0, 0, 0, 0.65)',
                          color: '#ffffff',
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          padding: '2px 5px',
                          borderRadius: '4px',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          backdropFilter: 'blur(2px)',
                        }}
                      >
                        <Star size={9} /> Make Primary
                      </button>
                    )
                  )}

                  {/* Delete / Remove (X) Button */}
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleDelete(idx)}
                      title="Remove this photo"
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        backgroundColor: 'rgba(15, 23, 42, 0.75)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '22px',
                        height: '22px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#dc2626';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.75)';
                      }}
                    >
                      <X size={13} strokeWidth={2.5} />
                    </button>
                  )}

                  {/* Index indicator */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '4px',
                      right: '6px',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      color: '#ffffff',
                      fontSize: '0.62rem',
                      padding: '1px 5px',
                      borderRadius: '4px',
                    }}
                  >
                    #{idx + 1}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Photos Count Status Indicator */}
          <div
            style={{
              marginTop: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              color: '#15803d',
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={16} color="#16a34a" />
            <span>
              {images.length} / {MAX_IMAGES} images uploaded
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CropImageUploader;
