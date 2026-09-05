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

const userIcon = new L.DivIcon({
  className: '',
  html: '<div style="width:16px;height:16px;border-radius:50%;background:#e87722;border:3px solid white;box-shadow:0 0 8px rgba(0,0,0,0.35)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Category color palette for map markers
const CATEGORY_COLORS: Record<string, string> = {
  SCA: '#1e40af',                 // Blue
  PSB: '#065f46',                 // Dark Green
  RRB: '#047857',                 // Emerald
  NBFC_MFI: '#6b21a8',            // Purple
  Cooperative_Bank: '#c2410c',    // Orange/Brown
  Other_Agency_SIDBI: '#0f766e',  // Teal
  Small_Finance_Bank: '#4338ca',  // Indigo
  Cooperative_Society: '#a16207', // Yellow/Gold
  default: '#334155',             // Slate
};

function createCategoryMarkerIcon(partnerType: string, isSelected: boolean) {
  const color = CATEGORY_COLORS[partnerType] || CATEGORY_COLORS.default;
  const size = isSelected ? 26 : 20;
  const borderWidth = isSelected ? 3 : 2;
  const shadow = isSelected ? 'box-shadow: 0 0 12px rgba(0,0,0,0.5); z-index: 1000;' : 'box-shadow: 0 0 5px rgba(0,0,0,0.25);';
  
  return new L.DivIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:${borderWidth}px solid white;${shadow}transition:all 200ms ease;"></div>`,
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
            <Popup>Search / Current Location</Popup>
          </Marker>
        )}

        {partners.map((partner) => {
          if (!partner.latitude || !partner.longitude) return null;
          const isSelected = selectedPartner?.id === partner.id;
          const icon = createCategoryMarkerIcon(partner.partner_type, isSelected);
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
                <div style={{ padding: '4px', maxWidth: 220 }}>
                  <div style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', color: isVerified ? '#059669' : '#b45309', marginBottom: 2 }}>
                    {isVerified ? '🟢 NSFDC VERIFIED' : '🟡 ADDITIONAL INSTITUTION'}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                    {partner.partner_type.replace('_', ' ')}
                  </span>
                  <h4 style={{ fontSize: 13, fontWeight: 800, color: '#0b1f3a', margin: '2px 0 4px' }}>
                    {partner.name}
                  </h4>
                  <p style={{ fontSize: 11, color: '#475569', margin: '0 0 6px', lineHeight: 1.3 }}>
                    {partner.address ? `${partner.address}, ` : ''}{partner.city}
                  </p>
                  {partner.distance_km != null && !isNaN(Number(partner.distance_km)) && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#ea580c' }}>
                      {Number(partner.distance_km).toFixed(1)} km away
                    </span>
                  )}
                  {partner.phone && (
                    <div style={{ marginTop: 4, fontSize: 11, fontWeight: 600 }}>
                      <a href={`tel:${partner.phone}`} style={{ color: '#0b1f3a', textDecoration: 'none' }}>
                        📞 {partner.phone}
                      </a>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        <MapController partners={partners} selectedPartner={selectedPartner} userLocation={userLocation} />
      </MapContainer>
    </div>
  );
}

