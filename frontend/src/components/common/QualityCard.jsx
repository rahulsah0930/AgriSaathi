import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Award,
  HelpCircle,
  UserCheck,
  Sparkles,
  Calendar,
  Layers,
  Droplets,
  AlertCircle,
  Loader2,
  Camera,
  Info,
} from 'lucide-react';
import { Button, Badge, Modal } from './';
import { api } from '../../services/api';

const STATUS_CONFIGS = {
  SELF_REPORTED: {
    label: 'Self-Reported',
    badgeVariant: 'warning',
    icon: HelpCircle,
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    description: 'This grade has been self-declared by the seller. Physical inspection by an authorized officer has not yet occurred.',
  },
  VERIFICATION_REQUESTED: {
    label: 'Verification Requested',
    badgeVariant: 'info',
    icon: Clock,
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
    description: 'The seller has requested an on-site or packhouse quality inspection. An authorized representative is scheduled to review.',
  },
  UNDER_REVIEW: {
    label: 'Under Inspection',
    badgeVariant: 'warning',
    icon: Clock,
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    description: 'Physical produce samples are currently undergoing quality assessment.',
  },
  NEEDS_INSPECTION: {
    label: 'Needs Inspection',
    badgeVariant: 'warning',
    icon: AlertTriangle,
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    description: 'Reviewer flagged lot as requiring physical packhouse inspection prior to transaction settlement.',
  },
  VERIFIED: {
    label: 'Officially Verified',
    badgeVariant: 'success',
    icon: ShieldCheck,
    color: '#059669',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    description: 'Physically inspected and verified by an authorized agricultural quality representative or buyer.',
  },
  REQUIRES_RECHECK: {
    label: 'Requires Recheck',
    badgeVariant: 'warning',
    icon: AlertTriangle,
    color: '#ea580c',
    bg: '#fff7ed',
    border: '#fed7aa',
    description: 'Inspector noted physical parameter discrepancies. Batch sorting or moisture re-measurement advised.',
  },
  REJECTED: {
    label: 'Grade Rejected',
    badgeVariant: 'danger',
    icon: ShieldAlert,
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
    description: 'Sample failed declared grade specifications.',
  },
};

export const QualityCard = ({
  lot,
  qualityReport,
  onReportUpdated,
  isSeller = true,
}) => {
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isBuyerReviewModalOpen, setIsBuyerReviewModalOpen] = useState(false);

  const [requestNotes, setRequestNotes] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Buyer/FPO review state
  const [buyerReviewStatus, setBuyerReviewStatus] = useState('ACCEPTABLE');
  const [buyerReviewNotes, setBuyerReviewNotes] = useState('');
  const [isSubmittingBuyerReview, setIsSubmittingBuyerReview] = useState(false);

  // Inspector Verify form state (for prototype demonstration)
  const [verifyForm, setVerifyForm] = useState({
    verification_status: 'VERIFIED',
    verified_grade: qualityReport?.seller_declared_grade || lot?.quality_grade || 'Grade A',
    verified_by: 'MahaAgri Quality Cell (Nashik APMC)',
    verifier_role: 'AUTHORIZED_OFFICER',
    moisture_percentage: qualityReport?.moisture_percentage || 12.0,
    damage_percentage: qualityReport?.damage_percentage || 1.5,
    freshness_status: 'FRESH',
    condition_summary: 'Inspected, Sorted & Packhouse Verified',
    verifier_notes: 'Physical lot inspection confirms optimal firmness, color uniformity, and export moisture parameters.',
  });
  const [isSubmittingVerify, setIsSubmittingVerify] = useState(false);

  const report = qualityReport || lot?.quality_report || {
    seller_declared_grade: lot?.quality_grade || 'Grade A',
    verification_status: 'SELF_REPORTED',
    condition_summary: 'Freshly Harvested',
    moisture_percentage: 12.0,
    damage_percentage: 2.0,
    freshness_status: 'FRESH',
    image_validation_status: 'PASSED',
  };

  const statusKey = report.verification_status || 'SELF_REPORTED';
  const statusCfg = STATUS_CONFIGS[statusKey] || STATUS_CONFIGS.SELF_REPORTED;
  const StatusIcon = statusCfg.icon;

  const handleRequestVerification = async (e) => {
    e.preventDefault();
    setIsSubmittingRequest(true);
    try {
      const res = await api.post(`/api/lots/${lot.id}/quality/request-verification`, {
        notes: requestNotes,
        preferred_date: preferredDate,
      });
      if (res.quality_report && onReportUpdated) {
        onReportUpdated(res.quality_report, res.lot);
      }
      setIsRequestModalOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to request quality verification.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleInspectSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingVerify(true);
    try {
      const res = await api.post(`/api/lots/${lot.id}/quality/verify`, verifyForm);
      if (res.quality_report && onReportUpdated) {
        onReportUpdated(res.quality_report, res.lot);
      }
      setIsVerifyModalOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to submit inspection verification.');
    } finally {
      setIsSubmittingVerify(false);
    }
  };

  const handleBuyerReviewSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingBuyerReview(true);
    try {
      const res = await api.post(`/api/lots/${lot.id}/quality-review`, {
        review_status: buyerReviewStatus,
        notes: buyerReviewNotes,
      });
      if (res.quality_report && onReportUpdated) {
        onReportUpdated(res.quality_report, res.lot);
      }
      setIsBuyerReviewModalOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to record quality review.');
    } finally {
      setIsSubmittingBuyerReview(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      {/* Title & Status Badge */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Award size={20} color="var(--primary-700)" />
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              Crop Quality Review & Verification
            </h3>
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)' }}>
            Transparent quality assessment: rule-based image validation, seller declarations, and authorized physical review.
          </div>
        </div>

        <div
          style={{
            backgroundColor: statusCfg.bg,
            border: `1px solid ${statusCfg.border}`,
            color: statusCfg.color,
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.85rem',
            fontWeight: 700,
          }}
        >
          <StatusIcon size={16} />
          <span>{statusCfg.label}</span>
        </div>
      </div>

      {/* 4 Pillars of Transparent Quality */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
        }}
      >
        {/* 1. Image Validated */}
        <div
          style={{
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#f8fafc',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <Camera size={16} color="var(--primary-700)" />
            <strong style={{ fontSize: '0.82rem', color: 'var(--slate-800)', textTransform: 'uppercase' }}>
              Image Validated
            </strong>
          </div>
          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#059669', marginBottom: '2px' }}>
            {report.image_validation_status === 'PASSED' ? '✓ Format & Resolution Passed' : '⚠️ Flagged / Unverified'}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--slate-500)' }}>
            Deterministic MIME, resolution (min 200x200), and corruption checks.
          </div>
        </div>

        {/* 2. Seller-Provided Information */}
        <div
          style={{
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#f8fafc',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <HelpCircle size={16} color="#d97706" />
            <strong style={{ fontSize: '0.82rem', color: 'var(--slate-800)', textTransform: 'uppercase' }}>
              Seller Provided
            </strong>
          </div>
          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '2px' }}>
            Declared: {report.seller_declared_grade || lot?.quality_grade || 'Grade A'}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--slate-500)' }}>
            Moisture: {report.moisture_percentage ?? '12'}% • Damage: {report.damage_percentage ?? '2'}% (Self-Declared)
          </div>
        </div>

        {/* 3. Prototype Assistance */}
        <div
          style={{
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#f8fafc',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <Info size={16} color="#2563eb" />
            <strong style={{ fontSize: '0.82rem', color: 'var(--slate-800)', textTransform: 'uppercase' }}>
              Prototype Assistance
            </strong>
          </div>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '2px' }}>
            Rule-Based Screening
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--slate-500)' }}>
            No trained crop computer vision model is currently used in this prototype.
          </div>
        </div>

        {/* 4. Buyer/FPO Review */}
        <div
          style={{
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: report.buyer_review_status ? '#ecfdf5' : '#f8fafc',
            border: `1px solid ${report.buyer_review_status ? '#a7f3d0' : 'var(--border-color)'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <UserCheck size={16} color={report.buyer_review_status ? '#059669' : 'var(--slate-500)'} />
            <strong style={{ fontSize: '0.82rem', color: 'var(--slate-800)', textTransform: 'uppercase' }}>
              Buyer / FPO Review
            </strong>
          </div>
          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: report.buyer_review_status === 'ACCEPTABLE' ? '#059669' : (report.buyer_review_status === 'REJECTED' ? '#dc2626' : '#d97706'), marginBottom: '2px' }}>
            {report.buyer_review_status ? report.buyer_review_status : 'Pending Review'}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--slate-500)' }}>
            {report.buyer_reviewed_by ? `By ${report.buyer_reviewed_by}` : 'Authorized buyer/FPO inspection'}
          </div>
        </div>
      </div>

      {/* Grade Comparison Details */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '14px',
          backgroundColor: '#f8fafc',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
        }}
      >
        <div style={{ borderRight: '1px solid var(--border-color)', paddingRight: '12px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', marginBottom: '4px' }}>
            Seller Declared (Self-Assessed)
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--slate-900)' }}>
            {report.seller_declared_grade || lot?.quality_grade || 'Grade A'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '2px' }}>
            Seller-provided attribute
          </div>
        </div>

        <div style={{ paddingLeft: '8px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', marginBottom: '4px' }}>
            Officially Verified Grade
          </div>
          <div
            style={{
              fontSize: '1.35rem',
              fontWeight: 800,
              color: statusKey === 'VERIFIED' ? '#059669' : 'var(--slate-400)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {statusKey === 'VERIFIED' ? (
              <>
                <ShieldCheck size={20} color="#059669" />
                {report.verified_grade || report.seller_declared_grade}
              </>
            ) : (
              <span style={{ fontSize: '1.05rem', fontWeight: 600 }}>Unverified</span>
            )}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '2px' }}>
            {statusKey === 'VERIFIED'
              ? `Verified by ${report.verified_by || 'Authorized Inspector'}`
              : 'Physical audit required'}
          </div>
        </div>
      </div>

      {/* Physical Quality Parameters Matrix */}
      <div>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--slate-700)', marginBottom: '10px' }}>
          Physical Quality Metrics (Seller Reported)
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '10px',
          }}
        >
          <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)', marginBottom: '4px' }}>Condition</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--slate-800)' }}>
              {report.condition_summary || 'Freshly Harvested'}
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)', marginBottom: '4px' }}>Moisture Content</div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--primary-700)' }}>
              {report.moisture_percentage !== null ? `${report.moisture_percentage}%` : 'N/A'}
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)', marginBottom: '4px' }}>Defect / Damage</div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: (report.damage_percentage || 0) <= 3 ? '#059669' : '#d97706' }}>
              {report.damage_percentage !== null ? `${report.damage_percentage}%` : 'N/A'}
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)', marginBottom: '4px' }}>Freshness</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: report.freshness_status === 'FRESH' ? '#059669' : '#d97706' }}>
              {report.freshness_status || 'FRESH'}
            </div>
          </div>
        </div>
      </div>

      {/* Honest Prototype Notice Callout */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          backgroundColor: '#f8fafc',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.82rem',
          color: 'var(--slate-600)',
        }}
      >
        <Info size={16} color="var(--slate-500)" style={{ flexShrink: 0 }} />
        <span>
          <strong>Prototype Note:</strong> Automated image validation checks file format and integrity. No trained crop computer vision model is currently used in this prototype. Final quality should be physically verified by Buyer/FPO.
        </span>
      </div>

      {/* Reviewer / Inspector Notes */}
      {(report.verifier_notes || report.buyer_review_notes) && (
        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            fontSize: '0.82rem',
            color: 'var(--slate-700)',
          }}
        >
          {report.buyer_review_notes && (
            <div>
              <strong>Buyer/FPO Review Note:</strong> {report.buyer_review_notes}
            </div>
          )}
          {report.verifier_notes && !report.buyer_review_notes && (
            <div>
              <strong>Inspector Note:</strong> {report.verifier_notes}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: '4px' }}>
        {statusKey === 'SELF_REPORTED' && isSeller && (
          <Button
            variant="primary"
            size="sm"
            icon={FileCheck}
            onClick={() => setIsRequestModalOpen(true)}
          >
            Request Official Quality Verification
          </Button>
        )}

        {/* Buyer / FPO Quality Review Button */}
        <Button
          variant="outline-primary"
          size="sm"
          icon={UserCheck}
          onClick={() => setIsBuyerReviewModalOpen(true)}
        >
          Record Buyer/FPO Quality Review
        </Button>

        {/* Prototype Inspector Simulation Button */}
        <Button
          variant="outline-secondary"
          size="sm"
          icon={ShieldCheck}
          onClick={() => setIsVerifyModalOpen(true)}
        >
          Simulate Officer Inspection
        </Button>
      </div>

      {/* Modal: Buyer/FPO Quality Review */}
      {isBuyerReviewModalOpen && (
        <Modal
          title="Buyer / FPO Quality Review"
          isOpen={isBuyerReviewModalOpen}
          onClose={() => setIsBuyerReviewModalOpen(false)}
        >
          <form onSubmit={handleBuyerReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--slate-600)' }}>
              Authorized review of farmer produce. Record visual/physical inspection status and observations. Original crop images remain preserved.
            </p>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                Review Status Decision
              </label>
              <select
                value={buyerReviewStatus}
                onChange={(e) => setBuyerReviewStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.9rem',
                }}
              >
                <option value="ACCEPTABLE">ACCEPTABLE (Quality Meets Standard)</option>
                <option value="NEEDS_INSPECTION">NEEDS_INSPECTION (Physical Inspection Required)</option>
                <option value="REJECTED">REJECTED (Quality Below Declared Grade)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                Reviewer Notes & Observations
              </label>
              <textarea
                rows={3}
                value={buyerReviewNotes}
                onChange={(e) => setBuyerReviewNotes(e.target.value)}
                placeholder="e.g. Visual sample acceptable; moisture content is consistent with Grade A tomato batch."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Button variant="outline-primary" type="button" onClick={() => setIsBuyerReviewModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={isSubmittingBuyerReview} icon={isSubmittingBuyerReview ? Loader2 : UserCheck}>
                {isSubmittingBuyerReview ? 'Saving...' : 'Submit Review'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Request Quality Verification */}
      {isRequestModalOpen && (
        <Modal
          title="Request Quality Verification"
          isOpen={isRequestModalOpen}
          onClose={() => setIsRequestModalOpen(false)}
        >
          <form onSubmit={handleRequestVerification} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--slate-600)' }}>
              An authorized APMC / FPO quality inspector will inspect your produce batch to verify grade, moisture, and absence of defect.
            </p>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                Preferred Inspection Date (Optional)
              </label>
              <input
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.9rem',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                Notes / Special Packhouse Access Instructions
              </label>
              <textarea
                rows={3}
                value={requestNotes}
                onChange={(e) => setRequestNotes(e.target.value)}
                placeholder="e.g., Produce stored in primary crates at farm gate; accessible between 8am and 12pm."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.85rem',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Button variant="outline-primary" type="button" onClick={() => setIsRequestModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={isSubmittingRequest} icon={isSubmittingRequest ? Loader2 : FileCheck}>
                {isSubmittingRequest ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Inspector Verify Simulation */}
      {isVerifyModalOpen && (
        <Modal
          title="Physical Quality Inspection Audit"
          isOpen={isVerifyModalOpen}
          onClose={() => setIsVerifyModalOpen(false)}
        >
          <form onSubmit={handleInspectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                  Inspection Status
                </label>
                <select
                  value={verifyForm.verification_status}
                  onChange={(e) => setVerifyForm((prev) => ({ ...prev, verification_status: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <option value="VERIFIED">VERIFIED (Pass Inspection)</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW (In Progress)</option>
                  <option value="REQUIRES_RECHECK">REQUIRES_RECHECK (Sorting Needed)</option>
                  <option value="REJECTED">REJECTED (Failed Standard)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                  Verified Grade
                </label>
                <select
                  value={verifyForm.verified_grade}
                  onChange={(e) => setVerifyForm((prev) => ({ ...prev, verified_grade: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <option value="Grade A">Grade A — Premium</option>
                  <option value="Grade B">Grade B — Standard</option>
                  <option value="Grade C">Grade C — Lower</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                  Moisture %
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={verifyForm.moisture_percentage}
                  onChange={(e) => setVerifyForm((prev) => ({ ...prev, moisture_percentage: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                  Defect / Damage %
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={verifyForm.damage_percentage}
                  onChange={(e) => setVerifyForm((prev) => ({ ...prev, damage_percentage: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                Inspector Notes & Audit Observations
              </label>
              <textarea
                rows={3}
                value={verifyForm.verifier_notes}
                onChange={(e) => setVerifyForm((prev) => ({ ...prev, verifier_notes: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Button variant="outline-primary" type="button" onClick={() => setIsVerifyModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={isSubmittingVerify} icon={isSubmittingVerify ? Loader2 : ShieldCheck}>
                {isSubmittingVerify ? 'Saving...' : 'Save Inspection Result'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default QualityCard;
