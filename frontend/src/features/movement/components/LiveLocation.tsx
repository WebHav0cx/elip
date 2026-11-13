import L from "leaflet";
import { useEffect, useRef, useState } from "react";
import { Circle, CircleMarker, Pane, Popup, useMap } from "react-leaflet";
import { nigeriaBounds } from "../config/nigeriaMap";

type Location = { position: [number, number]; accuracy: number };

export function LiveLocation({ onLocate }: { onLocate(): void }) {
  const map = useMap();
  const watch = useRef<number | null>(null);
  const [tracking, setTracking] = useState(false);
  const [location, setLocation] = useState<Location | null>(null);
  const [message, setMessage] = useState("");

  const stop = () => {
    if (watch.current !== null) navigator.geolocation.clearWatch(watch.current);
    watch.current = null;
    setTracking(false);
    setLocation(null);
  };

  useEffect(
    () => () => {
      if (watch.current !== null)
        navigator.geolocation.clearWatch(watch.current);
    },
    [],
  );

  const locate = () => {
    if (tracking) {
      stop();
      setMessage("Location tracking stopped.");
      return;
    }
    if (!window.isSecureContext || !navigator.geolocation) {
      setMessage("Location needs HTTPS or localhost and a supported browser.");
      return;
    }
    onLocate();
    setTracking(true);
    setMessage("Waiting for your location…");
    let firstFix = true;
    watch.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const position: [number, number] = [coords.latitude, coords.longitude];
        if (!nigeriaBounds.contains(position)) {
          setLocation(null);
          setMessage("Your location is outside the Nigeria map coverage.");
          return;
        }
        setLocation({ position, accuracy: coords.accuracy });
        setMessage(
          `Live location · accuracy ±${Math.round(coords.accuracy)} m`,
        );
        if (firstFix) {
          map.stop();
          map.setView(position, Math.max(map.getZoom(), 14));
          firstFix = false;
        }
      },
      (error) => {
        if (error.code === 1) {
          stop();
          setMessage(
            "Location access denied. Allow location in your browser settings, then try again.",
          );
        } else {
          setMessage(
            error.code === 3
              ? "Location timed out. Still trying; check your device’s location settings."
              : "Location unavailable. Still trying; check your device’s location settings.",
          );
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
  };

  return (
    <>
      <div
        className="absolute bottom-14 left-3 right-3 z-800 grid w-fit gap-1.5 rounded-lg border border-slate-200 bg-white p-2.5 shadow-md"
        ref={(element) => {
          if (element) {
            L.DomEvent.disableClickPropagation(element);
            L.DomEvent.disableScrollPropagation(element);
          }
        }}
      >
        <button
          type="button"
          aria-pressed={tracking}
          onClick={locate}
          className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 rounded-sm border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-600"
        >
          {tracking ? "Stop location tracking" : "My location"}
        </button>
        {message && (
          <p role="status" className="m-0 max-w-64 text-xs text-slate-600">
            {message}
          </p>
        )}
      </div>
      {location && (
        <Pane name="live-location" className="z-650">
          <Circle
            center={location.position}
            radius={location.accuracy}
            pathOptions={{
              color: "#2563eb",
              weight: 1,
              fillOpacity: 0.1,
              interactive: false,
            }}
          />
          <CircleMarker
            center={location.position}
            radius={8}
            pathOptions={{
              color: "#ffffff",
              weight: 3,
              fillColor: "#2563eb",
              fillOpacity: 1,
            }}
          >
            <Popup>
              Your live location
              <br />
              Accuracy: ±{Math.round(location.accuracy)} m
            </Popup>
          </CircleMarker>
        </Pane>
      )}
    </>
  );
}
