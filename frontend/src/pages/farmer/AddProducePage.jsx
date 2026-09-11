import React, { useState } from 'react';
import {
  PageHeader,
  Card,
  Input,
  Select,
  Textarea,
  Button,
  Badge,
} from '../../components/common';
import {
  PlusCircle,
  Sprout,
  MapPin,
  IndianRupee,
  CalendarDays,
  Scale,
  Warehouse,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileText,
  Camera,
} from 'lucide-react';
import { CropImageUploader, LocationPicker } from '../../components/common';
import api from '../../services/api';

const CROP_OPTIONS = [
  { value: 'Tomato', label: 'Tomato (टमाटर)' },
  { value: 'Onion', label: 'Onion (कांदा)' },
  { value: 'Grapes', label: 'Grapes (द्राक्ष)' },
  { value: 'Pomegranate', label: 'Pomegranate (डाळिंब)' },
  { value: 'Soybean', label: 'Soybean (सोयाबीन)' },
  { value: 'Sugarcane', label: 'Sugarcane (ऊस)' },
  { value: 'Wheat', label: 'Wheat (गहू)' },
  { value: 'Cotton', label: 'Cotton (कापूस)' },
  { value: 'Rice', label: 'Rice (तांदूळ)' },
  { value: 'Banana', label: 'Banana (केळी)' },
  { value: 'Mango', label: 'Mango (आंबा)' },
  { value: 'Turmeric', label: 'Turmeric (हळद)' },
  { value: 'Chilli', label: 'Chilli (मिरची)' },
  { value: 'Maize', label: 'Maize (मका)' },
];

const DISTRICT_OPTIONS = [
  { value: 'Nashik', label: 'Nashik (नाशिक)' },
  { value: 'Pune', label: 'Pune (पुणे)' },
  { value: 'Ahmednagar', label: 'Ahmednagar (अहमदनगर)' },
  { value: 'Solapur', label: 'Solapur (सोलापूर)' },
  { value: 'Kolhapur', label: 'Kolhapur (कोल्हापूर)' },
  { value: 'Sangli', label: 'Sangli (सांगली)' },
  { value: 'Satara', label: 'Satara (सातारा)' },
  { value: 'Aurangabad', label: 'Aurangabad (औरंगाबाद)' },
  { value: 'Jalgaon', label: 'Jalgaon (जळगाव)' },
  { value: 'Nagpur', label: 'Nagpur (नागपूर)' },
  { value: 'Amravati', label: 'Amravati (अमरावती)' },
  { value: 'Latur', label: 'Latur (लातूर)' },
];

const UNIT_OPTIONS = [
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'quintal', label: 'Quintal (100 kg)' },
  { value: 'tonne', label: 'Tonne (1000 kg)' },
];

const QUALITY_OPTIONS = [
  { value: 'Grade A', label: 'Grade A — Premium (Export Quality)' },
  { value: 'Grade B', label: 'Grade B — Standard (APMC Quality)' },
  { value: 'Grade C', label: 'Grade C — Lower (Local Market)' },
];

const STORAGE_OPTIONS = [
  { value: 'NOT_STORED', label: 'Not Stored — Available at Farm' },
  { value: 'IN_STORAGE', label: 'In Cold / Warehouse Storage' },
  { value: 'SCHEDULED', label: 'Storage Booking Scheduled' },
];

const CONDITION_OPTIONS = [
  { value: 'Freshly Harvested', label: 'Freshly Harvested — Recent harvest' },
  { value: 'Cleaned, Graded & Packed', label: 'Cleaned, Graded & Packhouse Boxed' },
  { value: 'Cured & Sun-Dried', label: 'Cured & Sun-Dried (Onion / Garlic)' },
  { value: 'Cold-Chain Chilled', label: 'Pre-cooled & Cold-chain Stored' },
  { value: 'Field Bulk Unsorted', label: 'Field Bulk — Unsorted Farm Gate' },
];

const FRESHNESS_OPTIONS = [
  { value: 'FRESH', label: 'FRESH — Firm texture, full moisture, peak freshness' },
  { value: 'FAIR', label: 'FAIR — Good condition, minor skin blemishes' },
  { value: 'AGING', label: 'AGING — Consume/process quickly (short shelf life)' },
];


export const AddProducePage = ({ user, onNavigate }) => {
  const [form, setForm] = useState({
    crop: '',
    variety: '',
    quantity: '',
    unit: 'kg',
    quality_grade: 'Grade A',
    harvest_date: '',
    location: 'Gat No. 142, Dindori Farm Road, Nashik',
    district: 'Nashik',
    latitude: 20.1983,
    longitude: 73.8344,
    address: 'Gat No. 142, Dindori Farm Road',
    village: 'Dindori',
    taluka: 'Dindori',
    pincode: '422202',
    state: 'Maharashtra',
    expected_price: '',
    storage_status: 'NOT_STORED',
    condition_summary: 'Freshly Harvested',
    moisture_percentage: '12',
    damage_percentage: '2',
    freshness_status: 'FRESH',
    notes: '',
  });

  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleLocationChange = (locData) => {
    setForm((prev) => ({
      ...prev,
      latitude: locData.latitude,
      longitude: locData.longitude,
      address: locData.address,
      village: locData.village,
      taluka: locData.taluka,
      district: locData.district,
      pincode: locData.pincode,
      state: locData.state,
      location: locData.location || locData.address || `${locData.village || 'Farm Gate'}, ${locData.district || 'Nashik'}`
    }));
    if (errors.location) {
      setErrors((prev) => ({ ...prev, location: null }));
    }
    if (errors.district) {
      setErrors((prev) => ({ ...prev, district: null }));
    }
  };

  const validate = (targetStatus = 'ACTIVE') => {
    const newErrors = {};
    if (!form.crop) newErrors.crop = 'Please select a crop.';
    if (!form.quantity || parseFloat(form.quantity) <= 0)
      newErrors.quantity = 'Enter a valid quantity.';
    if (!form.harvest_date) newErrors.harvest_date = 'Harvest date is required.';
    if (!form.location) newErrors.location = 'Enter the pickup location.';
    if (!form.district) newErrors.district = 'Select your district.';
    if (!form.expected_price || parseFloat(form.expected_price) <= 0)
      newErrors.expected_price = 'Enter a valid expected price.';
    
    // Require at least 1 image for ACTIVE lots
    if (targetStatus === 'ACTIVE' && images.length === 0) {
      newErrors.images = 'Please upload at least one produce photo before publishing.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e, targetStatus = 'ACTIVE') => {
    if (e && e.preventDefault) e.preventDefault();
    if (!validate(targetStatus)) return;

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const payload = {
        ...form,
        quantity: parseFloat(form.quantity),
        expected_price: parseFloat(form.expected_price),
        status: targetStatus,
        seller_id: user?.id || 1,
        seller_type: user?.role || 'FARMER',
        seller_name:
          user?.role === 'FPO'
            ? user?.profile?.fpo_name
            : user?.profile?.full_name || 'Demo Farmer',
        images: images.map((img, idx) => ({
          image_url: typeof img === 'string' ? img : img.image_url,
          is_primary: typeof img === 'object' ? !!img.is_primary : idx === 0,
        })),
      };

      const result = await api.post('/api/lots', payload);

      setSubmitResult({
        success: true,
        message: result.message || 'Crop lot published successfully!',
        lot: result.lot,
      });

      // Reset form
      setForm({
        crop: '',
        variety: '',
        quantity: '',
        unit: 'kg',
        quality_grade: 'Grade A',
        harvest_date: '',
        location: '',
        district: '',
        expected_price: '',
        storage_status: 'NOT_STORED',
        condition_summary: 'Freshly Harvested',
        moisture_percentage: '12',
        damage_percentage: '2',
        freshness_status: 'FRESH',
        notes: '',
      });
      setImages([]);

    } catch (err) {
      setSubmitResult({
        success: false,
        message: err.message || 'Failed to create lot. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (

    <div>
      <PageHeader
        title="Add Produce to Marketplace"
        subtitle="List your harvest for buyers across Maharashtra. Fill in the crop details below."
        icon={PlusCircle}
      />

      {/* Success Result */}
      {submitResult?.success && (
        <div
          style={{
            backgroundColor: 'var(--status-success-bg)',
            border: '1px solid var(--status-success-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 24px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
          }}
        >
          <CheckCircle2
            size={24}
            color="var(--status-success-text)"
            style={{ flexShrink: 0, marginTop: '2px' }}
          />
          <div>
            <h4
              style={{
                margin: '0 0 6px',
                color: 'var(--status-success-text)',
                fontSize: '1rem',
                fontWeight: 700,
              }}
            >
              Lot Published Successfully!
            </h4>
            <p
              style={{
                margin: '0 0 12px',
                color: 'var(--slate-700)',
                fontSize: '0.9rem',
              }}
            >
              {submitResult.message} Your produce is now visible to verified
              buyers.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onNavigate('my-lots')}
              >
                View My Produce
              </Button>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => setSubmitResult(null)}
              >
                Add Another Lot
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error Result */}
      {submitResult && !submitResult.success && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 18px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <AlertTriangle size={20} color="#dc2626" />
          <span style={{ color: '#b91c1c', fontSize: '0.9rem', fontWeight: 600 }}>
            {submitResult.message}
          </span>
        </div>
      )}

      {/* Form */}
      {!submitResult?.success && (
        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '24px',
            }}
          >
            {/* Crop Information Card */}
            <Card
              title="Crop Information"
              subtitle="What are you selling?"
              className=""
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px 0' }}>
                <Select
                  label="Crop Type"
                  id="crop"
                  name="crop"
                  value={form.crop}
                  onChange={(e) => handleChange('crop', e.target.value)}
                  options={CROP_OPTIONS}
                  placeholder="Select your crop..."
                  required
                  error={errors.crop}
                />
                <Input
                  label="Variety / Sub-type (Optional)"
                  id="variety"
                  name="variety"
                  value={form.variety}
                  onChange={(e) => handleChange('variety', e.target.value)}
                  placeholder="e.g., Hybrid Cherry, Red Nashik, Thompson Seedless"
                />
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <Input
                    label="Quantity"
                    id="quantity"
                    name="quantity"
                    type="number"
                    value={form.quantity}
                    onChange={(e) => handleChange('quantity', e.target.value)}
                    placeholder="e.g., 500"
                    required
                    error={errors.quantity}
                  />
                  <Select
                    label="Unit"
                    id="unit"
                    name="unit"
                    value={form.unit}
                    onChange={(e) => handleChange('unit', e.target.value)}
                    options={UNIT_OPTIONS}
                  />
                </div>
                <Select
                  label="Quality Grade"
                  id="quality_grade"
                  name="quality_grade"
                  value={form.quality_grade}
                  onChange={(e) => handleChange('quality_grade', e.target.value)}
                  options={QUALITY_OPTIONS}
                />
                <Input
                  label="Harvest Date"
                  id="harvest_date"
                  name="harvest_date"
                  type="date"
                  value={form.harvest_date}
                  onChange={(e) => handleChange('harvest_date', e.target.value)}
                  required
                  error={errors.harvest_date}
                />
                <Select
                  label="Produce Condition"
                  id="condition_summary"
                  name="condition_summary"
                  value={form.condition_summary}
                  onChange={(e) => handleChange('condition_summary', e.target.value)}
                  options={CONDITION_OPTIONS}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <Input
                    label="Est. Moisture (%)"
                    id="moisture_percentage"
                    name="moisture_percentage"
                    type="number"
                    step="0.1"
                    value={form.moisture_percentage}
                    onChange={(e) => handleChange('moisture_percentage', e.target.value)}
                    placeholder="e.g. 12.0"
                  />
                  <Input
                    label="Max Visual Defect (%)"
                    id="damage_percentage"
                    name="damage_percentage"
                    type="number"
                    step="0.1"
                    value={form.damage_percentage}
                    onChange={(e) => handleChange('damage_percentage', e.target.value)}
                    placeholder="e.g. 2.0"
                  />
                </div>
                <Select
                  label="Freshness Profile"
                  id="freshness_status"
                  name="freshness_status"
                  value={form.freshness_status}
                  onChange={(e) => handleChange('freshness_status', e.target.value)}
                  options={FRESHNESS_OPTIONS}
                />
              </div>
            </Card>


            {/* Pricing & Commercials Card */}
            <Card
              title="Pricing & Commercial Terms"
              subtitle="Set your expected price, storage readiness and transport notes"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px 0' }}>
                <Input
                  label={`Expected Price (₹ per ${form.unit || 'kg'})`}
                  id="expected_price"
                  name="expected_price"
                  type="number"
                  value={form.expected_price}
                  onChange={(e) => handleChange('expected_price', e.target.value)}
                  placeholder="e.g., 24.50"
                  required
                  error={errors.expected_price}
                  icon={IndianRupee}
                />
                <Select
                  label="Storage Status"
                  id="storage_status"
                  name="storage_status"
                  value={form.storage_status}
                  onChange={(e) => handleChange('storage_status', e.target.value)}
                  options={STORAGE_OPTIONS}
                />
                <Textarea
                  label="Additional Notes (Optional)"
                  id="notes"
                  name="notes"
                  value={form.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Any special instructions, transport requirements, or quality notes..."
                  rows={3}
                />
              </div>
            </Card>
          </div>

          {/* Accurate Farm Gate Location Card (Spanning full width) */}
          <div style={{ marginTop: '24px' }}>
            <LocationPicker
              value={{
                latitude: form.latitude,
                longitude: form.longitude,
                address: form.address,
                village: form.village,
                taluka: form.taluka,
                district: form.district,
                pincode: form.pincode,
                state: form.state,
                location: form.location,
              }}
              onChange={handleLocationChange}
              required
              title="Accurate Farm Gate Location (GPS & Interactive Map Pin)"
            />
          </div>

          {/* Produce Photos (Visual Evidence) Card */}
          <div style={{ marginTop: '24px' }}>
            <Card
              title="Produce Photos (Visual Evidence)"
              subtitle="Upload up to 5 clear photos of your harvest. High-quality visual evidence increases buyer response."
            >
              <div style={{ padding: '6px 0' }}>
                <CropImageUploader
                  images={images}
                  onChange={(newImgs) => {
                    setImages(newImgs);
                    if (errors.images) setErrors((prev) => ({ ...prev, images: null }));
                  }}
                />
                {errors.images && (
                  <div
                    style={{
                      marginTop: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#dc2626',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: 'var(--radius-md)',
                      padding: '8px 12px',
                    }}
                  >
                    <AlertTriangle size={16} />
                    <span>{errors.images}</span>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Market Intel Preview */}
          {form.crop && form.district && (
            <div
              style={{
                marginTop: '20px',
                background: 'linear-gradient(135deg, var(--primary-50), #eef2ff)',
                border: '1px solid var(--primary-200)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 20px',
              }}
            >
              <h4
                style={{
                  margin: '0 0 8px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: 'var(--primary-800)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Sprout size={16} /> Market Intelligence Preview
              </h4>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '16px',
                  fontSize: '0.85rem',
                  color: 'var(--slate-700)',
                }}
              >
                <span>
                  <strong>{form.crop}</strong> in <strong>{form.district}</strong>{' '}
                  APMC
                </span>
                <Badge variant="success">Current: ₹22-26/kg (APMC avg)</Badge>
                <Badge variant="info">AI says: SELL SOON</Badge>
                <Badge variant="warning">
                  Predicted +8% in 5 days
                </Badge>
              </div>
              <p
                style={{
                  margin: '8px 0 0',
                  fontSize: '0.8rem',
                  color: 'var(--slate-500)',
                }}
              >
                * Actual market prices and AI predictions will be displayed after
                your lot is published.
              </p>
            </div>
          )}

          {/* Submit Section */}
          <div
            style={{
              marginTop: '24px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingBottom: '32px',
            }}
          >
            <Button
              variant="outline-primary"
              onClick={() => onNavigate('dashboard')}
              type="button"
            >
              Cancel
            </Button>
            <Button
              variant="outline-primary"
              onClick={(e) => handleSubmit(e, 'DRAFT')}
              type="button"
              disabled={isSubmitting}
              icon={FileText}
            >
              Save as Draft
            </Button>
            <Button
              variant="primary"
              onClick={(e) => handleSubmit(e, 'ACTIVE')}
              type="button"
              disabled={isSubmitting}
              icon={isSubmitting ? Loader2 : PlusCircle}
            >
              {isSubmitting ? 'Publishing...' : 'Publish to Marketplace'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AddProducePage;
