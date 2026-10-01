import React, { useEffect, useRef } from 'react';

const MARKET_CENTERS = {
  mumbai: { lat: 19.0760, lng: 72.8777, zoom: 12 },
  kolkata: { lat: 22.5726, lng: 88.3639, zoom: 12 }
};

export const GoogleMapProvider = ({
  engineers = [],
  jobs = [],
  selectedEngineer = null,
  onSelectEngineer = null,
  currentMarket = 'mumbai',
  isCustomerView = false,
  customerLocality = null,
  engineerLat = null,
  engineerLng = null,
  customerLat = null,
  customerLng = null,
  jobStatus = null,
  engineerName = null,
  height = '460px',
  onRoutingFailed = null,
  layerVisibility = null,
  networkLayers = null
}) => {
  const mapRef = useRef(null);
  const googleMapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylinesRef = useRef([]);
  const directionsRendererRef = useRef(null);
  const infoWindowRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current || !window.google || !window.google.maps) return;

    const centerConfig = MARKET_CENTERS[currentMarket] || MARKET_CENTERS.mumbai;
    const initialCenter = isCustomerView && customerLat && customerLng
      ? { lat: customerLat, lng: customerLng }
      : { lat: centerConfig.lat, lng: centerConfig.lng };

    const mapOptions = {
      center: initialCenter,
      zoom: isCustomerView ? 14 : centerConfig.zoom,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        {
          featureType: 'all',
          elementType: 'geometry',
          stylers: [{ color: '#1E293B' }]
        },
        {
          featureType: 'all',
          elementType: 'labels.text.stroke',
          stylers: [{ color: '#0F172A' }]
        },
        {
          featureType: 'all',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#94A3B8' }]
        },
        {
          featureType: 'road',
          elementType: 'geometry',
          stylers: [{ color: '#334155' }]
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry',
          stylers: [{ color: '#0284C7' }]
        },
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#0B1528' }]
        }
      ]
    };

    const map = new window.google.maps.Map(mapRef.current, mapOptions);
    googleMapInstanceRef.current = map;
    infoWindowRef.current = new window.google.maps.InfoWindow();

    return () => {
      // Clean up markers
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, [currentMarket, isCustomerView]);

  // Render Markers and Routes
  useEffect(() => {
    const map = googleMapInstanceRef.current;
    if (!map || !window.google || !window.google.maps) return;

    // Clear previous markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    let hasPoints = false;

    if (isCustomerView) {
      // --- CUSTOMER TRACKING VIEW ---
      if (customerLat && customerLng) {
        const custPos = { lat: customerLat, lng: customerLng };
        bounds.extend(custPos);
        hasPoints = true;

        const customerMarker = new window.google.maps.Marker({
          position: custPos,
          map,
          title: `Your Premise: ${customerLocality || 'Service Location'}`,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: '#EF4444',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2.5
          }
        });
        markersRef.current.push(customerMarker);
      }

      if (engineerLat && engineerLng) {
        const engPos = { lat: engineerLat, lng: engineerLng };
        bounds.extend(engPos);
        hasPoints = true;

        const engineerMarker = new window.google.maps.Marker({
          position: engPos,
          map,
          title: `${engineerName || 'Technician'} (${jobStatus || 'Active'})`,
          icon: {
            path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: '#38BDF8',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
            rotation: 0
          }
        });
        markersRef.current.push(engineerMarker);

        // Calculate Google Road Route or fallback Polyline
        if (customerLat && customerLng) {
          try {
            const directionsService = new window.google.maps.DirectionsService();
            if (!directionsRendererRef.current) {
              directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
                map,
                suppressMarkers: true,
                polylineOptions: {
                  strokeColor: '#38BDF8',
                  strokeWeight: 4,
                  strokeOpacity: 0.9
                }
              });
            }

            directionsService.route(
              {
                origin: engPos,
                destination: { lat: customerLat, lng: customerLng },
                travelMode: window.google.maps.TravelMode.DRIVING
              },
              (result, status) => {
                if (status === window.google.maps.DirectionsStatus.OK) {
                  directionsRendererRef.current.setDirections(result);
                } else {
                  // Fallback to straight line polyline if Google routing fails or quota exceeded
                  if (onRoutingFailed) onRoutingFailed(status);
                  const fallbackLine = new window.google.maps.Polyline({
                    path: [engPos, { lat: customerLat, lng: customerLng }],
                    geodesic: true,
                    strokeColor: '#38BDF8',
                    strokeOpacity: 0.8,
                    strokeWeight: 3,
                    map
                  });
                  polylinesRef.current.push(fallbackLine);
                }
              }
            );
          } catch (err) {
            // Direct polyline fallback
            const fallbackLine = new window.google.maps.Polyline({
              path: [engPos, { lat: customerLat, lng: customerLng }],
              geodesic: true,
              strokeColor: '#38BDF8',
              strokeOpacity: 0.8,
              strokeWeight: 3,
              map
            });
            polylinesRef.current.push(fallbackLine);
          }
        }
      }

      if (hasPoints) {
        map.fitBounds(bounds);
        // Don't zoom in excessively
        const listener = window.google.maps.event.addListener(map, 'idle', () => {
          if (map.getZoom() > 16) map.setZoom(16);
          window.google.maps.event.removeListener(listener);
        });
      }
    } else {
      // --- OPERATIONS / NOC FLEET VIEW ---
      engineers.forEach((eng) => {
        if (!eng.current_latitude || !eng.current_longitude) return;
        const pos = { lat: eng.current_latitude, lng: eng.current_longitude };
        bounds.extend(pos);
        hasPoints = true;

        const isSelected = selectedEngineer?.id === eng.id;
        const markerColor =
          eng.status === 'ON_SITE' ? '#10B981' : eng.status === 'EN_ROUTE' ? '#38BDF8' : '#94A3B8';

        const marker = new window.google.maps.Marker({
          position: pos,
          map,
          title: `${eng.name} - ${eng.status}`,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: isSelected ? 10 : 7,
            fillColor: markerColor,
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: isSelected ? 3 : 1.5
          }
        });

        marker.addListener('click', () => {
          if (onSelectEngineer) onSelectEngineer(eng);
          infoWindowRef.current.setContent(`
            <div style="color: #0F172A; font-family: sans-serif; padding: 6px; font-size: 12px; min-width: 140px;">
              <strong>${eng.name}</strong><br/>
              <span style="color: #64748B;">Status: ${eng.status}</span><br/>
              ${eng.speed_kmh ? `Speed: ${Math.round(eng.speed_kmh)} km/h<br/>` : ''}
              ${eng.battery_level ? `Battery: ${eng.battery_level}%` : ''}
            </div>
          `);
          infoWindowRef.current.open(map, marker);
        });

        markersRef.current.push(marker);
      });

      // Active Job Destination Markers and Lines
      jobs.forEach((job) => {
        const eLat = job.engineer_latitude || job.current_latitude;
        const eLng = job.engineer_longitude || job.current_longitude;
        const cLat = job.service_latitude || job.customer_latitude;
        const cLng = job.service_longitude || job.customer_longitude;
        if (!eLat || !eLng || !cLat || !cLng) return;

        const custPos = { lat: cLat, lng: cLng };
        bounds.extend(custPos);
        hasPoints = true;

        const custMarker = new window.google.maps.Marker({
          position: custPos,
          map,
          title: `Premise: ${job.customer_locality || job.customer_name}`,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 5,
            fillColor: '#EF4444',
            fillOpacity: 0.9,
            strokeColor: '#FFFFFF',
            strokeWeight: 1.5
          }
        });
        markersRef.current.push(custMarker);

        const routeLine = new window.google.maps.Polyline({
          path: [{ lat: eLat, lng: eLng }, custPos],
          geodesic: true,
          strokeColor: job.status === 'COMPLETED' ? '#10B981' : '#38BDF8',
          strokeOpacity: 0.75,
          strokeWeight: job.status === 'EN_ROUTE' ? 2.5 : 1.5,
          map
        });
        polylinesRef.current.push(routeLine);
      });

      // ── Network Layer (Phase 7B) ──────────────────────────────────────────
      if (layerVisibility?.network && networkLayers) {
        (networkLayers.olts || []).forEach(olt => {
          if (!olt.lat || !olt.lng) return;
          const pos = { lat: olt.lat, lng: olt.lng };
          bounds.extend(pos);
          hasPoints = true;

          const m = new window.google.maps.Marker({
            position: pos,
            map,
            title: `OLT: ${olt.name || olt.code} (${olt.status})`,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#7C3AED',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2
            }
          });
          markersRef.current.push(m);
        });

        (networkLayers.fiber_cabinets || []).forEach(cab => {
          if (!cab.lat || !cab.lng) return;
          const pos = { lat: cab.lat, lng: cab.lng };
          bounds.extend(pos);
          hasPoints = true;

          const m = new window.google.maps.Marker({
            position: pos,
            map,
            title: `Cabinet: ${cab.name || cab.code} (${cab.status})`,
            icon: {
              path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
              scale: 6,
              fillColor: '#D97706',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 1.5
            }
          });
          markersRef.current.push(m);
        });

        (networkLayers.links || []).forEach(l => {
          if (!l.coordinates || l.coordinates.length < 2) return;
          const linkLine = new window.google.maps.Polyline({
            path: [
              { lat: l.coordinates[0][1], lng: l.coordinates[0][0] },
              { lat: l.coordinates[1][1], lng: l.coordinates[1][0] }
            ],
            strokeColor: '#06B6D4',
            strokeOpacity: 0.6,
            strokeWeight: 2,
            map
          });
          polylinesRef.current.push(linkLine);
        });
      }

      if (hasPoints) {
        map.fitBounds(bounds);
        const listener = window.google.maps.event.addListener(map, 'idle', () => {
          if (map.getZoom() > 14) map.setZoom(14);
          window.google.maps.event.removeListener(listener);
        });
      }
    }
  }, [
    engineers,
    jobs,
    selectedEngineer,
    isCustomerView,
    engineerLat,
    engineerLng,
    customerLat,
    customerLng,
    jobStatus,
    engineerName,
    layerVisibility,
    networkLayers
  ]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-800 shadow-inner" style={{ height }}>
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute bottom-3 left-3 z-10 bg-slate-900/90 backdrop-blur-xs border border-slate-700/80 rounded-xl px-3 py-1.5 text-[10px] text-slate-300 flex items-center gap-3 shadow-lg pointer-events-none">
        <span className="flex items-center gap-1.5 font-bold text-sky-400">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
          <span>Google Maps Platform</span>
        </span>
        <span className="text-slate-500">&bull;</span>
        <span className="text-slate-400 font-mono">Live GIS Overlay</span>
      </div>
    </div>
  );
};
