import api from './api';
import { handleApiError } from '../utils/handleApiError';

export const getPieces = async (params = {}) => {
  try {
    const response = await api.get('/pieces', { params });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getPieceById = async (id) => {
  try {
    const response = await api.get(`/pieces/${id}`);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const searchPieces = async (query) => {
  try {
    const response = await api.get('/pieces/search', { params: { q: query } });
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};