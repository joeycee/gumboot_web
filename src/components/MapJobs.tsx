"use client";

import { useMemo, useCallback, useState } from "react";
import { APIProvider, Map, Marker, useApiIsLoaded } from "@vis.gl/react-google-maps";
import { Job } from "@/lib/jobs";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');

  :root{
    --teal-1:#1c8fb2;
    --teal-2:#2097bd;
    --panel:#f8fbfc;
    --text:#0f172a;
    --muted:#64748b;
    --muted-2:#94a3b8;
    --line:#e2e8f0;
  }

  .mj-root * { box-sizing: border-box; }
  .mj-root {
    position: absolute;
    inset: 0;
    font-family: 'DM Sans', sans-serif;
  }

  /* Error state */
  .mj-error {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background:
      radial-gradient(1200px 600px at 20% 10%, rgba(255,255,255,0.18), rgba(255,255,255,0) 60%),
      linear-gradient(135deg, var(--teal-1), var(--teal-2));
  }

  /* Light readable container */
  .mj-error-card {
    background: var(--panel);
    border: 1px solid rgba(15,23,42,0.12);
    border-radius: 16px;
    padding: 26px 30px;
    text-align: center;
    box-shadow:
      0 18px 50px rgba(0,0,0,0.10),
      0 8px 18px rgba(0,0,0,0.06);
    max-width: 420px;
    margin: 0 16px;
  }
  .mj-error-icon { font-size: 28px; margin-bottom: 10px; }
  .mj-error-text { font-size: 13px; color: rgba(15,23,42,0.72); letter-spacing: 0.02em; margin: 0; }

  /* Job count badge — light frosted pill */
  .mj-badge {
    position: absolute;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    pointer-events: none;

    background: rgba(248,251,252,0.82);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.55);
    border-radius: 999px;
    padding: 8px 14px;

    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    color: var(--muted);
    white-space: nowrap;

    box-shadow:
      0 10px 24px rgba(0,0,0,0.12),
      0 2px 10px rgba(0,0,0,0.06);
  }
  .mj-badge-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 22px;
    height: 22px;
    padding: 0 8px;
    border-radius: 999px;
    margin-right: 8px;

    background: linear-gradient(135deg, var(--teal-1), var(--teal-2));
    color: #ffffff;
    font-weight: 800;
    letter-spacing: 0.02em;
  }

  .mj-map-wrap { position: absolute; inset: 0; }
  .mj-map-wrap > div { height: 100% !important; }
  .mj-loading {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background:
      radial-gradient(1200px 600px at 20% 10%, rgba(255,255,255,0.14), rgba(255,255,255,0) 60%),
      linear-gradient(135deg, rgba(28,143,178,0.18), rgba(32,151,189,0.28));
    color: rgba(15,23,42,0.72);
    z-index: 1;
  }
  .mj-loading-card {
    background: rgba(248,251,252,0.82);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.55);
    border-radius: 16px;
    padding: 18px 20px;
    box-shadow:
      0 18px 50px rgba(0,0,0,0.10),
      0 8px 18px rgba(0,0,0,0.06);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.10em;
    text-transform: uppercase;
  }

  /* Optional: subtle map vignette so markers pop */
  .mj-vignette {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 5;
    background:
      radial-gradient(1200px 700px at 50% 20%, rgba(0,0,0,0), rgba(0,0,0,0.08) 70%);
  }
`;

export function MapJobs({
  jobs,
  onSelect,
}: {
  jobs: Job[];
  onSelect: (job: Job) => void;
}) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const apiOrigin = useMemo(
    () => (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/api\/?$/, ""),
    []
  );

  const defaultCenter = { lat: -36.8485, lng: 174.7633 };

  const markerJobs = useMemo(
    () =>
      jobs.filter(
        (job) =>
          Number.isFinite(job.lat) &&
          Number.isFinite(job.lng) &&
          !(job.lat === 0 && job.lng === 0) &&
          job.lat >= -90 &&
          job.lat <= 90 &&
          job.lng >= -180 &&
          job.lng <= 180
      ),
    [jobs]
  );

  const center =
    markerJobs.length > 0
      ? { lat: markerJobs[0].lat, lng: markerJobs[0].lng }
      : defaultCenter;

  const resolveIconUrl = useCallback(
    (iconPath?: string) => {
      if (!iconPath) return "/globe.svg";
      if (iconPath.startsWith("http://") || iconPath.startsWith("https://")) return iconPath;

      const origin = apiOrigin.endsWith("/") ? apiOrigin.slice(0, -1) : apiOrigin;
      const raw = iconPath.startsWith("/") ? `${origin}${iconPath}` : `${origin}/${iconPath}`;
      try {
        return new URL(raw).toString();
      } catch {
        return raw;
      }
    },
    [apiOrigin]
  );

  if (!key) {
    return (
      <>
        <style>{styles}</style>
        <div className="mj-root mj-error">
          <div className="mj-error-card">
            <div className="mj-error-icon">⚠</div>
            <p className="mj-error-text">Missing Google Maps API key.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="mj-root">
        <APIProvider apiKey={key}>
          <MapJobsCanvas
            center={center}
            markerJobs={markerJobs}
            onSelect={onSelect}
            resolveIconUrl={resolveIconUrl}
          />

          {markerJobs.length > 0 && (
            <div className="mj-badge">
              <span className="mj-badge-count">{markerJobs.length}</span>
              job{markerJobs.length !== 1 ? "s" : ""} on map
            </div>
          )}
        </APIProvider>
      </div>
    </>
  );
}

function MapJobsCanvas({
  center,
  markerJobs,
  onSelect,
  resolveIconUrl,
}: {
  center: { lat: number; lng: number };
  markerJobs: Job[];
  onSelect: (job: Job) => void;
  resolveIconUrl: (iconPath?: string) => string;
}) {
  const apiIsLoaded = useApiIsLoaded();
  const [zoom, setZoom] = useState(11);

  const getSpreadPosition = useCallback(
    (job: Job) => {
      const SAME_LOCATION_TOLERANCE = 0.0001;
      const nearbyJobs = markerJobs.filter(
        (otherJob) =>
          Math.abs(otherJob.lat - job.lat) < SAME_LOCATION_TOLERANCE &&
          Math.abs(otherJob.lng - job.lng) < SAME_LOCATION_TOLERANCE
      );

      if (nearbyJobs.length <= 1) {
        return { lat: job.lat, lng: job.lng };
      }

      const currentJobIndexInCluster = nearbyJobs.findIndex((item) => item.id === job.id);
      if (currentJobIndexInCluster < 0) {
        return { lat: job.lat, lng: job.lng };
      }

      const effectiveZoom = Number.isFinite(zoom) ? zoom : 11;
      const degreesPerPixel = 360 / (256 * Math.pow(2, effectiveZoom));
      const lngDegreesPerPixel = degreesPerPixel / Math.max(Math.cos((job.lat * Math.PI) / 180), 0.2);

      const baseSeparationPx = 46;
      let remainingIndex = currentJobIndexInCluster;
      let ring = 0;

      while (true) {
        if (ring === 0) {
          if (remainingIndex === 0) break;
          remainingIndex -= 1;
          ring += 1;
          continue;
        }

        const ringCapacity = Math.max(6 * ring, Math.ceil((2 * Math.PI * baseSeparationPx * ring) / baseSeparationPx));
        if (remainingIndex < ringCapacity) break;
        remainingIndex -= ringCapacity;
        ring += 1;
      }

      if (ring === 0) {
        return { lat: job.lat, lng: job.lng };
      }

      const ringCapacity = Math.max(6 * ring, Math.ceil((2 * Math.PI * baseSeparationPx * ring) / baseSeparationPx));
      const angle = (remainingIndex / ringCapacity) * Math.PI * 2;
      const radiusPx = baseSeparationPx * ring;

      return {
        lat: job.lat + Math.sin(angle) * radiusPx * degreesPerPixel,
        lng: job.lng + Math.cos(angle) * radiusPx * lngDegreesPerPixel,
      };
    },
    [markerJobs, zoom]
  );

  const markerCircle = useMemo(() => {
    if (!apiIsLoaded || typeof window === "undefined" || !window.google?.maps) return null;
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: 18,
      fillColor: "#26A69A",
      fillOpacity: 1,
      strokeColor: "rgba(255,255,255,0.10)",
      strokeWeight: 1,
      anchor: new window.google.maps.Point(0, 0),
    };
  }, [apiIsLoaded]);

  const markerIcon = useMemo(() => {
    if (!apiIsLoaded || typeof window === "undefined" || !window.google?.maps) return null;
    return {
      scaledSize: new window.google.maps.Size(38, 38),
      anchor: new window.google.maps.Point(19, 19),
    };
  }, [apiIsLoaded]);

  return (
    <div className="mj-map-wrap">
      {!apiIsLoaded ? (
        <div className="mj-loading">
          <div className="mj-loading-card">Loading map…</div>
        </div>
      ) : null}

      <Map
        defaultCenter={center}
        defaultZoom={11}
        disableDefaultUI={false}
        gestureHandling="greedy"
        onCameraChanged={(event) => {
          const nextZoom = event.detail.zoom;
          if (typeof nextZoom === "number" && Number.isFinite(nextZoom)) {
            setZoom(nextZoom);
          }
        }}
      >
        {markerJobs.map((j) => (
          <Marker
            key={`${j.id}-circle`}
            position={getSpreadPosition(j)}
            icon={markerCircle ?? undefined}
            zIndex={1}
          />
        ))}
        {markerJobs.map((j) => {
          const iconPosition = getSpreadPosition(j);
          return (
            <Marker
              key={`${j.id}-icon`}
              position={{ lat: iconPosition.lat, lng: iconPosition.lng }}
              onClick={() => onSelect(j)}
              icon={{
                url: resolveIconUrl(j.jobTypeIconPath || j.imageUrl),
                ...(markerIcon ?? {}),
              }}
              zIndex={2}
            />
          );
        })}
      </Map>

      <div className="mj-vignette" />
    </div>
  );
}
