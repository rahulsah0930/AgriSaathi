import React, { useState, useEffect } from 'react';
import {
  PageHeader,

  Card,
  Button,
  Badge,
  LoadingState,
  Modal,
  CropImageUploader,
  QualityCard,
  LocationPicker,
} from '../../components/common';

import {
  ArrowLeft,
  Package,
  MapPin,
  CalendarDays,
  Warehouse,
  IndianRupee,
  Scale,
  Star,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Tag,
  CheckCircle2,
  XCircle,
  Building2,
  User as UserIcon,
  Camera,
  Maximize2,
  Trash2,
  UploadCloud,
  X,
  Navigation,
} from 'lucide-react';
import { api, getImageUrl } from '../../services/api';
import {
  calculateHaversineDistance,
  estimateTransitTime,
  estimateFreightCost,
  KNOWN_HUBS,
} from '../../utils/geoUtils';


const STATUS_COLORS = {
  ACTIVE: 'success',
  DRAFT: 'warning',
  RESERVED: 'info',
  SOLD: 'success',
  EXPIRED: 'danger',
  CANCELLED: 'danger',
};

const RISK_COLORS = {
  LOW: { bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46' },
  MEDIUM: { bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
  HIGH: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b' },
};

export const LotDetailPage = ({ lotId, user, onNavigate }) => {
  const [lot, setLot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offerActionLoading, setOfferActionLoading] = useState(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [showUploader, setShowUploader] = useState(false);

  const handleMakePrimary = async (imgId) => {
    try {
      await api.patch(`/api/lots/${lot.id}/images/${imgId}/primary`, {});
      setLot((prev) => {
        const updatedImages = (prev.images || []).map((img) => ({
          ...img,
          is_primary: img.id === imgId,
        }));
        const prim = updatedImages.find((img) => img.id === imgId);
        return {
          ...prev,
          images: updatedImages,
          primary_image_url: prim ? prim.image_url : prev.primary_image_url,
          image_url: prim ? prim.image_url : prev.image_url,
        };
      });
    } catch (err) {
      alert(err.message || 'Failed to set as primary image.');
    }
  };

  const handleDeleteImage = async (imgId) => {
    if (!window.confirm('Are you sure you want to delete this produce photo?')) return;
    try {
      const res = await api.delete(`/api/lots/${lot.id}/images/${imgId}`);
      if (res.images) {
        setLot((prev) => ({
          ...prev,
          images: res.images,
          images_count: res.images.length,
          primary_image_url: res.images.find((i) => i.is_primary)?.image_url || res.images[0]?.image_url || null,
          image_url: res.images.find((i) => i.is_primary)?.image_url || res.images[0]?.image_url || null,
        }));
        setSelectedImageIdx(0);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete produce photo.');
    }
  };


  useEffect(() => {
    async function fetchLot() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.get(`/api/lots/${lotId}`);
        setLot(data.lot);
      } catch (err) {
        setError(err.message || 'Failed to load lot details.');
      } finally {
        setIsLoading(false);
      }
    }
    if (lotId) fetchLot();
  }, [lotId]);

  const handleOfferAction = async (offerId, action) => {
    setOfferActionLoading(offerId);
    // Unified platform trade agreement
    await new Promise((resolve) => setTimeout(resolve, 800));
    setLot((prev) => ({
      ...prev,
      buyer_offers: prev.buyer_offers.map((o) =>
        o.id === offerId
          ? { ...o, status: action === 'accept' ? 'ACCEPTED' : 'REJECTED' }
          : o
      ),
    }));
    setOfferActionLoading(null);
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Lot Details" icon={Package} />
        <LoadingState message="Loading lot details and AI recommendations..." />
      </div>
    );
  }

  if (error || !lot) {
    return (
      <div>
        <PageHeader title="Lot Details" icon={Package} />
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
          }}
        >
          <AlertTriangle size={48} color="#dc2626" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ color: 'var(--slate-800)', marginBottom: '8px' }}>
            {error || 'Lot not found'}
          </h3>
          <Button variant="primary" onClick={() => onNavigate('my-lots')}>
            Back to My Produce
          </Button>
        </div>
      </div>
    );
  }

  const aiRec = lot.ai_recommendation;
  const offers = lot.buyer_offers || [];
  const riskStyle = RISK_COLORS[aiRec?.risk] || RISK_COLORS.MEDIUM;

  return (
    <div>
      {/* Back Navigation */}
      <button
        onClick={() => onNavigate('my-lots')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: 'none',
          color: 'var(--primary-700)',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '0.88rem',
          padding: '4px 0',
          marginBottom: '16px',
        }}
      >
        <ArrowLeft size={16} />
        Back to My Produce
      </button>

      {/* Lot Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--primary-700), var(--primary-900))',
          borderRadius: 'var(--radius-lg)',
          padding: '28px 32px',
          color: '#ffffff',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>
                {lot.crop}
              </h2>
              {lot.variety && lot.variety !== 'Standard' && (
                <span
                  style={{
                    fontSize: '0.9rem',
                    opacity: 0.8,
                    fontWeight: 500,
                  }}
                >
                  — {lot.variety}
                </span>
              )}
              <Badge variant={STATUS_COLORS[lot.status]}>{lot.status}</Badge>
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '20px',
                fontSize: '0.88rem',
                opacity: 0.9,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Scale size={14} /> {lot.quantity} {lot.unit}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {lot.verification_status === 'VERIFIED' ? (
                  <span
                    style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.25)',
                      border: '1px solid #34d399',
                      borderRadius: '4px',
                      padding: '1px 7px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                    }}
                  >
                    <ShieldCheck size={14} color="#34d399" />
                    Verified {lot.quality_grade}
                  </span>
                ) : (
                  <span>
                    <Star size={14} /> Declared {lot.quality_grade}
                  </span>
                )}
              </span>

              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <MapPin size={14} /> {lot.location}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <CalendarDays size={14} /> Harvest: {lot.harvest_date}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Warehouse size={14} />{' '}
                {lot.storage_status === 'IN_STORAGE'
                  ? 'In Storage'
                  : lot.storage_status === 'SCHEDULED'
                  ? 'Storage Scheduled'
                  : 'At Farm'}
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.78rem', opacity: 0.7, marginBottom: '4px' }}>
              Expected Price
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>
              ₹{lot.expected_price.toLocaleString('en-IN')}
              <span style={{ fontSize: '0.85rem', fontWeight: 500, opacity: 0.7 }}>
                /{lot.unit}
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', opacity: 0.7, marginTop: '4px' }}>
              Lot #{lot.id} • Listed by {lot.seller_name}
            </div>
          </div>
        </div>
      </div>

      {/* Produce Visual Evidence Gallery */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3
              style={{
                margin: 0,
                fontSize: '1.15rem',
                fontWeight: 800,
                color: 'var(--slate-900)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Camera size={22} color="var(--primary-700)" />
              Produce Photos & Visual Evidence
            </h3>
            <Badge variant="info">
              {lot.images?.length || 0} photo{lot.images?.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {(lot.images?.length || 0) < 5 && (
            <Button
              variant={showUploader ? 'outline-primary' : 'primary'}
              size="sm"
              icon={showUploader ? X : UploadCloud}
              onClick={() => setShowUploader((prev) => !prev)}
            >
              {showUploader ? 'Close Uploader' : 'Add More Photos'}
            </Button>
          )}
        </div>

        {/* Collapsible Direct Uploader */}
        {showUploader && (
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              marginBottom: '20px',
            }}
          >
            <CropImageUploader
              lotId={lot.id}
              images={lot.images || []}
              onChange={(updatedImages) => {
                setLot((prev) => ({
                  ...prev,
                  images: updatedImages,
                  images_count: updatedImages.length,
                  primary_image_url:
                    updatedImages.find((i) => i.is_primary)?.image_url ||
                    updatedImages[0]?.image_url ||
                    null,
                }));
                setShowUploader(false);
              }}
            />
          </div>
        )}

        {/* Images Display */}
        {lot.images && lot.images.length > 0 ? (
          <div>
            {/* Main Showcase Image */}
            {(() => {
              const activeImg = lot.images[selectedImageIdx] || lot.images[0];
              const fullUrl = getImageUrl(activeImg?.image_url);
              return (
                <div>
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      maxHeight: '400px',
                      height: '340px',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      backgroundColor: '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'var(--shadow-sm)',
                      cursor: 'zoom-in',
                    }}
                    onClick={() => setIsZoomOpen(true)}
                  >
                    <img
                      src={fullUrl}
                      alt={`Produce photo ${selectedImageIdx + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                      }}
                      onError={(e) => {
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&q=80';
                      }}
                    />

                    {/* Top Overlay Badges */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        display: 'flex',
                        gap: '8px',
                      }}
                    >
                      {activeImg.is_primary && (
                        <div
                          style={{
                            backgroundColor: 'var(--primary-600)',
                            color: '#ffffff',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                          }}
                        >
                          <Star size={12} fill="#ffffff" /> Primary Photo
                        </div>
                      )}
                      <div
                        style={{
                          backgroundColor: 'rgba(0,0,0,0.65)',
                          color: '#ffffff',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        Photo {selectedImageIdx + 1} of {lot.images.length}
                      </div>
                    </div>

                    {/* Bottom Right Zoom Icon */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '12px',
                        right: '12px',
                        backgroundColor: 'rgba(0,0,0,0.65)',
                        color: '#ffffff',
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backdropFilter: 'blur(2px)',
                      }}
                    >
                      <Maximize2 size={14} /> Click to Expand
                    </div>
                  </div>

                  {/* Actions bar for active photo */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '12px',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {!activeImg.is_primary && (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          icon={Star}
                          onClick={() => handleMakePrimary(activeImg.id)}
                        >
                          Set as Primary Photo
                        </Button>
                      )}
                      {lot.images.length > 1 && (
                        <Button
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          onClick={() => handleDeleteImage(activeImg.id)}
                        >
                          Delete Photo
                        </Button>
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)' }}>
                      Uploaded: {activeImg.uploaded_at ? new Date(activeImg.uploaded_at).toLocaleDateString() : 'Active listing'}
                    </div>
                  </div>

                  {/* Thumbnails Row */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '12px',
                      marginTop: '14px',
                      overflowX: 'auto',
                      paddingBottom: '4px',
                    }}
                  >
                    {lot.images.map((img, idx) => {
                      const isSelected = idx === selectedImageIdx;
                      return (
                        <div
                          key={img.id || idx}
                          onClick={() => setSelectedImageIdx(idx)}
                          style={{
                            position: 'relative',
                            width: '80px',
                            height: '80px',
                            borderRadius: 'var(--radius-md)',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            flexShrink: 0,
                            border: isSelected
                              ? '3px solid var(--primary-600)'
                              : '2px solid var(--border-color)',
                            boxShadow: isSelected ? '0 0 0 2px rgba(22, 163, 74, 0.3)' : 'none',
                            opacity: isSelected ? 1 : 0.7,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <img
                            src={getImageUrl(img.image_url)}
                            alt={`Thumbnail ${idx + 1}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                          {img.is_primary && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '3px',
                                left: '3px',
                                backgroundColor: 'var(--primary-600)',
                                color: '#ffffff',
                                borderRadius: '50%',
                                width: '16px',
                                height: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Star size={9} fill="#ffffff" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          /* Empty Photo State */
          <div
            style={{
              textAlign: 'center',
              padding: '36px 16px',
              backgroundColor: '#f8fafc',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-color)',
            }}
          >
            <Camera size={36} color="var(--slate-400)" style={{ margin: '0 auto 10px' }} />
            <h4 style={{ margin: '0 0 4px', color: 'var(--slate-700)', fontSize: '0.95rem' }}>
              No Produce Photos Uploaded
            </h4>
            <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: 'var(--slate-500)' }}>
              Produce lots with verified photos receive 3x more buyer inquiries and higher price bids.
            </p>
            <Button
              variant="primary"
              size="sm"
              icon={UploadCloud}
              onClick={() => setShowUploader(true)}
            >
              Upload Produce Photos Now
            </Button>
          </div>
        )}
      </div>

      {/* Modal Zoom for Full Picture */}
      {isZoomOpen && lot.images && lot.images[selectedImageIdx] && (
        <div
          onClick={() => setIsZoomOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <button
              onClick={() => setIsZoomOpen(false)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: 'none',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            >
              <X size={24} /> Close
            </button>
            <img
              src={getImageUrl(lot.images[selectedImageIdx].image_url)}
              alt="Expanded Produce View"
              style={{
                maxWidth: '100%',
                maxHeight: '82vh',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
                objectFit: 'contain',
              }}
            />
            <div style={{ marginTop: '10px', color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>
              {lot.crop} ({lot.quality_grade}) — Photo {selectedImageIdx + 1} of {lot.images.length}
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Left Column: AI Recommendation + Quality Verification */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* AI Recommendation Card */}
        {aiRec && (

          <div
            style={{
              background: `linear-gradient(135deg, ${riskStyle.bg}, #ffffff)`,
              border: `2px solid ${riskStyle.border}`,
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: riskStyle.text,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Sparkles size={20} />
                AI Sale Recommendation
              </h3>
              <Badge variant={aiRec.recommendation === 'SELL SOON' ? 'danger' : 'warning'}>
                {aiRec.recommendation}
              </Badge>
            </div>

            {/* Recommendation Details */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '14px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  textAlign: 'center',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginBottom: '4px' }}>
                  Current APMC Price
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary-700)' }}>
                  ₹{aiRec.current_price}
                  <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>/{lot.unit}</span>
                </div>
              </div>
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  textAlign: 'center',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginBottom: '4px' }}>
                  Predicted Price (7-day)
                </div>
                <div
                  style={{
                    fontSize: '1.3rem',
                    fontWeight: 800,
                    color: aiRec.predicted_price > aiRec.current_price ? '#059669' : '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  {aiRec.predicted_price > aiRec.current_price ? (
                    <TrendingUp size={18} />
                  ) : (
                    <TrendingDown size={18} />
                  )}
                  ₹{aiRec.predicted_price}
                  <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>/{lot.unit}</span>
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '14px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  textAlign: 'center',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginBottom: '4px' }}>
                  <Clock size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />{' '}
                  Sell Window
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-800)' }}>
                  {aiRec.recommended_window}
                </div>
              </div>
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  textAlign: 'center',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginBottom: '4px' }}>
                  Est. Net Return
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-700)' }}>
                  ₹{aiRec.estimated_net_return?.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Risk Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
              }}
            >
              <span style={{ fontSize: '0.82rem', color: 'var(--slate-600)', fontWeight: 600 }}>
                Price Volatility Risk:
              </span>
              <span
                style={{
                  backgroundColor: riskStyle.bg,
                  color: riskStyle.text,
                  border: `1px solid ${riskStyle.border}`,
                  padding: '2px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                }}
              >
                {aiRec.risk}
              </span>
            </div>

            {/* Reasoning */}
            <div
              style={{
                backgroundColor: 'rgba(255,255,255,0.7)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                fontSize: '0.85rem',
                color: 'var(--slate-700)',
                lineHeight: 1.55,
                borderLeft: `3px solid ${riskStyle.border}`,
              }}
            >
              <strong>AI Analysis:</strong> {aiRec.reason}
            </div>
          </div>
        )}

        {/* Quality Information & Verification Card */}
        <QualityCard
          lot={lot}
          qualityReport={lot.quality_report}
          onReportUpdated={(updatedReport, updatedLot) => {
            if (updatedLot) {
              setLot(updatedLot);
            } else {
              setLot((prev) => ({
                ...prev,
                quality_report: updatedReport,
                verification_status: updatedReport.verification_status,
                quality_grade: updatedReport.verified_grade || prev.quality_grade,
                verified_grade: updatedReport.verified_grade,
              }));
            }
          }}
          isSeller={user?.id === lot.seller_id || !lot.seller_id}
        />
        </div>

        {/* Buyer Offers Section */}
        <div>
          <div
            style={{
              backgroundColor: '#ffffff',

              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '18px',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: 'var(--slate-900)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Tag size={20} color="var(--accent-amber)" />
                Buyer Offers
              </h3>
              <Badge variant="info">{offers.length} offer{offers.length !== 1 ? 's' : ''}</Badge>
            </div>

            {offers.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '32px 16px',
                  color: 'var(--slate-500)',
                  fontSize: '0.9rem',
                }}
              >
                <Tag size={36} color="var(--slate-300)" style={{ margin: '0 auto 10px' }} />
                <p style={{ margin: 0 }}>No buyer offers yet. Your lot is visible to verified buyers across Maharashtra.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {offers.map((offer) => (
                  <div
                    key={offer.id}
                    style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px 18px',
                      backgroundColor:
                        offer.status === 'ACCEPTED'
                          ? 'var(--status-success-bg)'
                          : offer.status === 'REJECTED'
                          ? '#fef2f2'
                          : '#fafafa',
                    }}
                  >
                    {/* Buyer Info */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '10px',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '4px',
                          }}
                        >
                          <Building2 size={16} color="var(--slate-600)" />
                          <strong style={{ fontSize: '0.95rem', color: 'var(--slate-800)' }}>
                            {offer.buyer_name}
                          </strong>
                          {offer.buyer_verification_status === 'VERIFIED' && (
                            <ShieldCheck size={14} color="var(--status-success-text)" />
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--slate-500)',
                          }}
                        >
                          Delivery by: {offer.delivery_date} • Qty: {offer.quantity} {offer.unit}
                        </div>
                      </div>
                      <Badge variant={STATUS_COLORS[offer.status] || 'warning'}>
                        {offer.status}
                      </Badge>
                    </div>

                    {/* Price Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '10px',
                        marginBottom: '12px',
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: '#ffffff',
                          borderRadius: 'var(--radius-sm)',
                          padding: '10px',
                          textAlign: 'center',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>
                          Offer Price
                        </div>
                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-700)' }}>
                          ₹{offer.offer_price}/{lot.unit}
                        </div>
                      </div>
                      <div
                        style={{
                          backgroundColor: '#ffffff',
                          borderRadius: 'var(--radius-sm)',
                          padding: '10px',
                          textAlign: 'center',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>
                          Total Value
                        </div>
                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                          ₹{offer.total_value?.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {offer.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={CheckCircle2}
                          onClick={() => handleOfferAction(offer.id, 'accept')}
                          disabled={offerActionLoading === offer.id}
                        >
                          {offerActionLoading === offer.id ? 'Processing...' : 'Accept Offer'}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={XCircle}
                          onClick={() => handleOfferAction(offer.id, 'reject')}
                          disabled={offerActionLoading === offer.id}
                        >
                          Reject
                        </Button>
                      </div>
                    )}

                    {offer.status === 'ACCEPTED' && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: 'var(--status-success-text)',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                        }}
                      >
                        <CheckCircle2 size={16} />
                        Offer accepted — formal contract initialized in Transactions.
                      </div>
                    )}
                    {offer.status === 'REJECTED' && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#dc2626',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                        }}
                      >
                        <XCircle size={16} />
                        Offer rejected.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Farm Gate & Pickup Location Map */}
          <div style={{ marginTop: '20px' }}>
            <LocationPicker
              value={{
                latitude: lot.latitude || 20.1983,
                longitude: lot.longitude || 73.8344,
                address: lot.address || lot.location,
                village: lot.village || 'Dindori',
                taluka: lot.taluka || 'Dindori',
                district: lot.district || 'Nashik',
                pincode: lot.pincode || '422202',
                state: lot.state || 'Maharashtra',
                location: lot.location,
              }}
              readOnly={true}
              title="Farm Gate & Logistics Pickup Spot"
            />
          </div>

          {/* Mandi & Hub Proximity Matrix (Haversine Distance + Freight) */}
          <div
            style={{
              marginTop: '16px',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}
            >
              <h4
                style={{
                  margin: 0,
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  color: 'var(--slate-800)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Navigation size={16} color="var(--primary-600)" />
                Mandi & Hub Proximity Matrix
              </h4>
              <Badge variant="info">Haversine GPS</Badge>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.values(KNOWN_HUBS).slice(0, 3).map((hub) => {
                const dist = calculateHaversineDistance(
                  lot.latitude || 20.1983,
                  lot.longitude || 73.8344,
                  hub.lat,
                  hub.lng
                );
                const time = estimateTransitTime(dist);
                const freight = estimateFreightCost(dist, lot.quantity || 500);
                return (
                  <div
                    key={hub.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      backgroundColor: 'var(--slate-50)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--slate-800)' }}>{hub.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>Transit: ~{time}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: 'var(--primary-700)' }}>{dist} km</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>
                        Freight: ~₹{freight.costPerQuintal}/qtl
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lot Metadata */}
          <div
            style={{
              marginTop: '20px',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 22px',
            }}
          >
            <h4
              style={{
                margin: '0 0 12px',
                fontSize: '0.92rem',
                fontWeight: 700,
                color: 'var(--slate-700)',
              }}
            >
              Lot Details
            </h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                fontSize: '0.83rem',
              }}
            >
              {[
                ['Lot ID', `#${lot.id}`],
                ['Seller', lot.seller_name],
                ['Type', lot.seller_type],
                ['Verification', lot.seller_verification_status],
                ['Created', lot.created_at ? new Date(lot.created_at).toLocaleDateString() : '—'],
                ['Members', lot.members_count > 0 ? `${lot.members_count} farmers` : 'N/A'],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--slate-500)' }}>{label}</span>
                  <span style={{ fontWeight: 600, color: 'var(--slate-800)' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LotDetailPage;
