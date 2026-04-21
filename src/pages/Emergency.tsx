import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, MapPin, Heart, AlertTriangle, Loader2, Navigation, ExternalLink } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';

interface NearbyPlace {
  name: string;
  distance: number;
  lat: number;
  lon: number;
  type: string;
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateEta(distKm: number) {
  const mins = Math.round(distKm / 0.5); // ~30km/h city driving
  return mins < 1 ? '< 1 min' : `${mins} min`;
}

const firstAid = [
  'Stay calm and assess the situation',
  'Call 999 for emergency services immediately',
  'Do not move the patient if spinal injury is suspected',
  'Apply pressure to any bleeding wounds',
  'Keep the patient warm and comfortable',
];

export default function Emergency() {
  const [hospitals, setHospitals] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setUserCoords({ lat, lon });

        try {
          // Query Overpass API for hospitals & clinics within 5km
          const radius = 5000;
          const query = `
            [out:json][timeout:10];
            (
              node["amenity"="hospital"](around:${radius},${lat},${lon});
              way["amenity"="hospital"](around:${radius},${lat},${lon});
              node["amenity"="clinic"](around:${radius},${lat},${lon});
              way["amenity"="clinic"](around:${radius},${lat},${lon});
            );
            out center body;
          `;

          const res = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: `data=${encodeURIComponent(query)}`,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          });

          const data = await res.json();
          const places: NearbyPlace[] = data.elements
            .map((el: any) => {
              const elLat = el.lat ?? el.center?.lat;
              const elLon = el.lon ?? el.center?.lon;
              if (!elLat || !elLon) return null;
              const name = el.tags?.name || (el.tags?.amenity === 'clinic' ? 'Clinic' : 'Hospital');
              return {
                name,
                distance: getDistanceKm(lat, lon, elLat, elLon),
                lat: elLat,
                lon: elLon,
                type: el.tags?.amenity || 'hospital',
              };
            })
            .filter(Boolean)
            .sort((a: NearbyPlace, b: NearbyPlace) => a.distance - b.distance)
            .slice(0, 8);

          setHospitals(places);
        } catch {
          setLocationError('Failed to fetch nearby hospitals. Please try again.');
        }
        setLoading(false);
      },
      () => {
        setLocationError('Location access denied. Please enable location services.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const openMaps = (place: NearbyPlace) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader title="Emergency Mode" subtitle="Immediate assistance" />

      <div className="flex-1 px-5 pb-6 flex flex-col gap-4">
        {/* Emergency Call */}
        <motion.a href="tel:999" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center gap-3 py-5 rounded-2xl gradient-emergency text-emergency-foreground shadow-glow-emergency">
          <Phone className="w-6 h-6" />
          <span className="text-lg font-bold">Call Emergency — 999</span>
        </motion.a>

        {/* Alert Banner */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex items-start gap-3 p-4 rounded-2xl bg-emergency/5 border border-emergency/15">
          <AlertTriangle className="w-5 h-5 text-emergency shrink-0 mt-0.5" />
          <p className="text-xs text-foreground leading-relaxed">
            If you are experiencing a medical emergency, call 999 immediately. Do not rely solely on this app.
          </p>
        </motion.div>

        {/* Nearby Hospitals — Real Data */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card rounded-2xl p-5 shadow-card">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> Nearest Hospitals & Clinics
          </h3>

          {loading && (
            <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Finding nearby hospitals...</span>
            </div>
          )}

          {locationError && (
            <div className="text-sm text-emergency bg-emergency/5 rounded-xl p-3">{locationError}</div>
          )}

          {!loading && !locationError && hospitals.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">No hospitals found nearby. Try expanding your search area.</p>
          )}

          <div className="flex flex-col gap-2.5">
            {hospitals.map((h, i) => (
              <button key={i} onClick={() => openMaps(h)}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-accent transition-colors text-left group">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{h.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {h.type} · {h.distance < 1 ? `${Math.round(h.distance * 1000)}m` : `${h.distance.toFixed(1)} km`} away
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-xs font-bold text-primary bg-accent px-2.5 py-1 rounded-lg">{estimateEta(h.distance)}</span>
                  <Navigation className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* First Aid */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl p-5 shadow-card">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4 text-emergency" /> First Aid Instructions
          </h3>
          <ol className="flex flex-col gap-2">
            {firstAid.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </motion.div>
      </div>
    </div>
  );
}
