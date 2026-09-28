import React, { createContext, useContext, useState, useCallback } from 'react';
import { GPS_TRACKING_STATES } from '../constants/gpsConstants.js';

export { GPS_TRACKING_STATES };

export const GpsTrackingContext = createContext({
  trackingStatus: GPS_TRACKING_STATES.NOT_TRACKING,
  setTrackingStatus: () => {},
  lastPingTime: null,
  setLastPingTime: () => {},
  accuracy: null,
  setAccuracy: () => {},
  isMock: false,
  setIsMock: () => {},
  resetTracking: () => {}
});

export const GpsTrackingProvider = ({ children }) => {
  const [trackingStatus, setTrackingStatusState] = useState(GPS_TRACKING_STATES.NOT_TRACKING);
  const [lastPingTime, setLastPingTime] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [isMock, setIsMock] = useState(false);

  const setTrackingStatus = useCallback((status) => {
    setTrackingStatusState(status);
  }, []);

  const resetTracking = useCallback(() => {
    setTrackingStatusState(GPS_TRACKING_STATES.NOT_TRACKING);
    setLastPingTime(null);
    setAccuracy(null);
    setIsMock(false);
  }, []);

  return React.createElement(
    GpsTrackingContext.Provider,
    {
      value: {
        trackingStatus,
        setTrackingStatus,
        lastPingTime,
        setLastPingTime,
        accuracy,
        setAccuracy,
        isMock,
        setIsMock,
        resetTracking
      }
    },
    children
  );
};

export const useGpsTracking = () => useContext(GpsTrackingContext);
export default GpsTrackingProvider;
