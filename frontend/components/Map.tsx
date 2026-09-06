'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet marker icons in Next.js/webpack builds
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// User location pin
const userIcon = new L.DivIcon({
  className: '',
  html: '<div style="width:18px;height:18px;border-radius:50%;background:#e87722;border:3px solid white;box-shadow:0 0 10px rgba(232,119,34,0.6);animation:pulse 2s infinite;"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// Dual-Zone Marker Icons: Blue Pins for Grassroots Branches (<= 35km), Gold Emblem Pins for Apex SCAs (<= 150km)
function createDualZoneMarkerIcon(partnerType: string, isSelected: boolean) {
  const isSCA = partnerType === 'SCA';
  const size = isSelected ? 30 : 22;
  const borderWidth = isSelected ? 3 : 2;

  if (isSCA) {
    // Gold Emblem Pin for Apex State Channelizing Agency
    const shadow = isSelected
      ? 'box-shadow: 0 0 16px rgba(217, 119, 6, 0.85); z-index: 1000;'
      : 'box-shadow: 0 2px 8px rgba(180, 83, 9, 0.45);';
    return new L.DivIcon({
      className: '',
      html: `
        <div style="
          width:${size}px;
          height:${size}px;
          border-radius:50%;
          background: linear-gradient(135deg, #fbbf24 0%, #d97706 50%, #b45309 100%);
          border:${borderWidth}px solid #ffffff;
          ${shadow}
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:${isSelected ? 13 : 10}px;
          transition: all 200ms ease;
          cursor: pointer;
        ">
          🏛️
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  // Blue Pin for Grassroots Commercial Bank Branches (PSB, RRB, NBFC-MFI, SFB)
  const shadow = isSelected
    ? 'box-shadow: 0 0 16px rgba(37, 99, 235, 0.85); z-index: 1000;'
    : 'box-shadow: 0 2px 8px rgba(30, 64, 175, 0.45);';
  return new L.DivIcon({
    className: '',
    html: `
      <div style="
        width:${size}px;
        height:${size}px;
        border-radius:50%;
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 60%, #1d4ed8 100%);
        border:${borderWidth}px solid #ffffff;
        ${shadow}
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:${isSelected ? 12 : 9}px;
        color: #ffffff;
        font-weight: 800;
        transition: all 200ms ease;
        cursor: pointer;
      ">
        🏦
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export interface MapPartner {
  id: number;
  name: string;
  partner_type: string;
  address?: string;
  city: string;
  state?: string;
  phone?: string | null;
  latitude: number;
  longitude: number;
  distance_km?: number;
  verification_status?: string;
  npa_percent?: number | null;
  fund_availability_status?: string;
  tier?: 'GRASSROOTS' | 'APEX_SCA';
  is_escalated?: boolean;
}

interface Props {
  userLocation?: { lat: number; lng: number } | null;
  partners: MapPartner[];
  selectedPartner?: MapPartner | null;
  onPartnerClick?: (p: MapPartner) => void;
  height?: string;
}

function MapController({
  partners,
  selectedPartner,
  userLocation,
}: {
  partners: MapPartner[];
  selectedPartner?: MapPartner | null;
  userLocation?: { lat: number; lng: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedPartner && selectedPartner.latitude && selectedPartner.longitude) {
      map.flyTo([selectedPartner.latitude, selectedPartner.longitude], 13, { duration: 0.8 });
    } else if (partners.length > 0) {
      const validPoints = partners
        .filter((p) => p.latitude && p.longitude)
        .map((p) => [p.latitude, p.longitude] as [number, number]);

      if (validPoints.length === 1) {
        map.flyTo(validPoints[0], 12, { duration: 0.8 });
      } else if (validPoints.length > 1) {
        const bounds = L.latLngBounds(validPoints);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      }
    } else if (userLocation && userLocation.lat && userLocation.lng) {
      map.flyTo([userLocation.lat, userLocation.lng], 10, { duration: 0.8 });
    }
  }, [selectedPartner, partners, userLocation, map]);

  return null;
}

export default function Map({
  userLocation,
  partners,
  selectedPartner,
  onPartnerClick,
  height = '500px',
}: Props) {
  const defaultCenter: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : partners.length > 0 && partners[0].latitude
    ? [partners[0].latitude, partners[0].longitude]
    : [20.5937, 78.9629]; // Center of India

  return (
    <div style={{ width: '100%', height, position: 'relative' }}>
      <MapContainer
        center={defaultCenter}
        zoom={6}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <div style={{ padding: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#e87722', textTransform: 'uppercase' }}>
                  Search Origin
                </span>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                  Your Current / Selected Location
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {partners.map((partner) => {
          if (!partner.latitude || !partner.longitude) return null;
          const isSelected = selectedPartner?.id === partner.id;
          const isSCA = partner.partner_type === 'SCA';
          const icon = createDualZoneMarkerIcon(partner.partner_type, isSelected);
          const isVerified = !partner.verification_status || partner.verification_status === 'verified';

          return (
            <Marker
              key={partner.id}
              position={[partner.latitude, partner.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => onPartnerClick?.(partner),
              }}
            >
              <Popup>
                <div style={{ padding: '6px', maxWidth: 240, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {/* Tier Header Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                    <span
                      style={{
                        fontSize: 9.5,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: isSCA ? '#fef3c7' : '#dbeafe',
                        color: isSCA ? '#92400e' : '#1e40af',
                      }}
                    >
                      {isSCA ? '🏛️ APEX STATE AGENCY (150 KM)' : '🏦 GRASSROOTS BRANCH (35 KM)'}
                    </span>
                    {isVerified && (
                      <span style={{ fontSize: 9.5, fontWeight: 800, color: '#059669' }}>
                        ✓ NSFDC
                      </span>
                    )}
                  </div>

                  {/* Branch Name */}
                  <h4 style={{ fontSize: 13, fontWeight: 800, color: '#0b1f3a', margin: '2px 0 0', lineHeight: 1.3 }}>
                    {partner.name}
                  </h4>

                  {/* Address */}
                  <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 4px', lineHeight: 1.35 }}>
                    {partner.address ? `${partner.address}, ` : ''}{partner.city}{partner.state ? `, ${partner.state}` : ''}
                  </p>

                  {/* Financial Health & Quota Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, margin: '2px 0 4px' }}>
                    {partner.npa_percent != null && (
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: Number(partner.npa_percent) <= 7.0 ? '#dcfce7' : '#fee2e2',
                          color: Number(partner.npa_percent) <= 7.0 ? '#15803d' : '#b91c1c',
                        }}
                      >
                        {Number(partner.npa_percent) <= 7.0 ? '🟢' : '🔴'} {partner.npa_percent}% NPA
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: 9.5,
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: '#f1f5f9',
                        color: '#334155',
                      }}
                    >
                      💰 Funds: {partner.fund_availability_status || 'Available'}
                    </span>
                  </div>

                  {/* Distance & Nodal Phone */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                    {partner.distance_km != null && !isNaN(Number(partner.distance_km)) && (
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#ea580c' }}>
                        📍 {Number(partner.distance_km).toFixed(1)} km away
                      </span>
                    )}
                  </div>

                  {partner.phone && (
                    <div style={{ marginTop: 2, fontSize: 11, fontWeight: 600 }}>
                      <a href={`tel:${partner.phone}`} style={{ color: '#0284c7', textDecoration: 'none' }}>
                        📞 Nodal Officer: {partner.phone}
                      </a>
                    </div>
                  )}

                  {partner.is_escalated && (
                    <div style={{ marginTop: 4, fontSize: 10, fontWeight: 700, color: '#b45309', background: '#fffbeb', padding: '3px 6px', borderRadius: 4, border: '1px solid #fde68a' }}>
                      ⚠️ Escalated Direct Channel
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        <MapController partners={partners} selectedPartner={selectedPartner} userLocation={userLocation} />
      </MapContainer>

      {/* Floating Dual-Zone Cartographic Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          zIndex: 900,
          background: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(8px)',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: '10px 14px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          fontSize: 11,
          fontWeight: 700,
          color: '#334155',
        }}
      >
        <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em', borderBottom: '1px solid #f1f5f9', paddingBottom: 4 }}>
          Channel Map Legend
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#2563eb', border: '1.5px solid white', boxShadow: '0 0 4px rgba(37,99,235,0.5)' }} />
          <span>Grassroots Bank (≤ 35 km)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'linear-gradient(135deg, #fbbf24, #d97706)', border: '1.5px solid white', boxShadow: '0 0 4px rgba(217,119,6,0.5)' }} />
          <span>Apex State Agency (≤ 150 km)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#e87722', border: '1.5px solid white' }} />
          <span>Search / Origin</span>
        </div>
      </div>
    </div>
  );
}

