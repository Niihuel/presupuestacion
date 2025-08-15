import api from './api';
import { handleApiError } from '../utils/handleApiError';

export const getQuotations = async (params = {}) => {
  try {
    const response = await api.get('/quotations', { params });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getQuotationById = async (id) => {
  try {
    const response = await api.get(`/quotations/${id}`);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const createQuotation = async (data) => {
  try {
    const response = await api.post('/quotations', data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateQuotation = async (id, data) => {
  try {
    const response = await api.put(`/quotations/${id}`, data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const duplicateQuotation = async (id) => {
  try {
    const response = await api.post(`/quotations/${id}/duplicate`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const approveQuotation = async (id) => {
  try {
    const response = await api.patch(`/quotations/${id}/approve`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getQuotationPDF = async (id) => {
  try {
    const response = await api.get(`/quotations/${id}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};