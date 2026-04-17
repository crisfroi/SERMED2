// Stub implementations for imaging hooks
import { useState } from 'react';

export const useLabOrder = () => {
  const [orders, setOrders] = useState([]);
  return { orders };
};

export const useNormalRanges = () => {
  const [ranges, setRanges] = useState({});
  return { ranges };
};

export const useLabResults = () => {
  const [results, setResults] = useState([]);
  return { results };
};

export const useTrendAnalysis = () => {
  const [trends, setTrends] = useState({});
  return { trends };
};

export const useDicomViewer = () => {
  const [images, setImages] = useState([]);
  return { images };
};

export const useImagingOrder = () => {
  const [imagingOrders, setImagingOrders] = useState([]);
  return { imagingOrders };
};

export const useRadiologyReport = () => {
  const [reports, setReports] = useState([]);
  return { reports };
};
