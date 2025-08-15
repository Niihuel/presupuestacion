import api from './api';
import { handleApiError } from '../utils/handleApiError';

export const getZones = async () => {
  try {
    const response = await api.get('/zones');
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getZoneById = async (id) => {
  try {
    const response = await api.get(`/zones/${id}`);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const createZone = async (data) => {
  try {
    const response = await api.post('/zones', data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateZone = async (id, data) => {
  try {
    const response = await api.put(`/zones/${id}`, data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getZonePrices = async (zoneId, params = {}) => {
  try {
    const response = await api.get(`/zones/${zoneId}/prices`, { params });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const setZonePrices = async (zoneId, prices) => {
  try {
    const response = await api.post(`/zones/${zoneId}/prices`, { prices });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const copyZonePrices = async (sourceZoneId, targetZoneId, adjustmentPercentage = 0) => {
  try {
    const response = await api.post('/zones/copy-prices', {
      sourceZoneId,
      targetZoneId,
      adjustmentPercentage
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};