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
  html: '<div style="width:14px;height:14px;border-radius:50%;background:#1a56db;border:3px solid white;box-shadow:0 0 6px rgba(0,0,0,0.3)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const partnerIcon = new L.DivIcon({
  className: '',
  html: '<div style="width:20px;height:20px;border-radius:50%;background:#059669;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.25)"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const selectedPartnerIcon = new L.DivIcon({
  className: '',
  html: '<div style="width:24px;height:24px;border-radius:50%;background:#d97706;border:3px solid white;box-shadow:0 0 8px rgba(0,0,0,0.4)"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

interface Partner {
  id: number;
  name: string;
  partner_type: string;
  address: string;
  city: string;
  phone: string;
  latitude: number;
  longitude: number;
  distance_km: number;
}

interface Props {
  userLocation: { lat: number; lng: number };
  partners: Partner[];
  selectedPartner: Partner | null;
  onPartnerClick: (p: Partner) => void;
}

function FlyToSelected({ partner }: { partner: Partner | null }) {
  const map = useMap();
  useEffect(() => {
    if (partner) {
      map.flyTo([partner.latitude, partner.longitude], 13, { duration: 0.8 });
    }
  }, [partner, map]);
  return null;
}

export default function Map({ userLocation, partners, selectedPartner, onPartnerClick }: Props) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', height: '320px' }}>
      <MapContainer
        center={[userLocation.lat, userLocation.lng]}
        zoom={11}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          <Popup>Your location</Popup>
        </Marker>

        {partners.map((partner) => (
          <Marker
            key={partner.id}
            position={[partner.latitude, partner.longitude]}
            icon={selectedPartner?.id === partner.id ? selectedPartnerIcon : partnerIcon}
            eventHandlers={{ click: () => onPartnerClick(partner) }}
          >
            <Popup>
              <strong>{partner.name}</strong>
              <br />
              {partner.city} · {partner.distance_km.toFixed(1)} km
              {partner.phone && <><br />{partner.phone}</>}
            </Popup>
          </Marker>
        ))}

        <FlyToSelected partner={selectedPartner} />
      </MapContainer>
    </div>
  );
}
