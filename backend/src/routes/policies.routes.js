/**
 * Routes for managing global system policies
 * 
 * Endpoints:
 * - GET /api/policies - Get current policies
 * - PUT /api/policies - Update policies
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { body, validationResult } = require('express-validator');
const { executeQuery } = require('../config/database');
const { AppError } = require('../utils/errors');
const { catchAsync } = require('../utils/catchAsync');
const { ApiResponse } = require('../utils/apiResponse');

// Get current policies
router.get('/', authenticate, catchAsync(async (req, res) => {
  const query = `
    SELECT 
      policy_key,
      policy_value,
      policy_type,
      description,
      updated_at,
      updated_by
    FROM system_policies
    WHERE is_active = 1
    ORDER BY policy_key
  `;
  
  const result = await executeQuery(query);
  
  // Transform to object format
  const policies = {};
  result.forEach(row => {
    let value = row.policy_value;
    
    // Parse value based on type
    if (row.policy_type === 'boolean') {
      value = value === 'true' || value === '1';
    } else if (row.policy_type === 'number') {
      value = parseFloat(value);
    }
    
    policies[row.policy_key] = value;
  });
  
  res.json(ApiResponse.success(policies));
}));

// Update policies
router.put('/', 
  authenticate, 
  authorize('admin'),
  catchAsync(async (req, res) => {
    const policies = req.body;
    const userId = req.user.id;
    const timestamp = new Date().toISOString();
    
    // Start transaction
    const transaction = await executeQuery('BEGIN TRANSACTION');
    
    try {
      // Update each policy
      for (const [key, value] of Object.entries(policies)) {
        // Determine type
        let valueStr = String(value);
        let valueType = 'string';
        
        if (typeof value === 'boolean') {
          valueType = 'boolean';
          valueStr = value ? 'true' : 'false';
        } else if (typeof value === 'number') {
          valueType = 'number';
        }
        
        // Check if policy exists
        const checkQuery = `
          SELECT id FROM system_policies 
          WHERE policy_key = @key
        `;
        
        const existing = await executeQuery(checkQuery, { key });
        
        if (existing.length > 0) {
          // Update existing
          const updateQuery = `
            UPDATE system_policies
            SET 
              policy_value = @value,
              policy_type = @type,
              updated_at = @timestamp,
              updated_by = @userId
            WHERE policy_key = @key
          `;
          
          await executeQuery(updateQuery, {
            key,
            value: valueStr,
            type: valueType,
            timestamp,
            userId
          });
        } else {
          // Insert new
          const insertQuery = `
            INSERT INTO system_policies (
              policy_key,
              policy_value,
              policy_type,
              description,
              is_active,
              created_at,
              created_by,
              updated_at,
              updated_by
            ) VALUES (
              @key,
              @value,
              @type,
              @description,
              1,
              @timestamp,
              @userId,
              @timestamp,
              @userId
            )
          `;
          
          await executeQuery(insertQuery, {
            key,
            value: valueStr,
            type: valueType,
            description: `Policy: ${key}`,
            timestamp,
            userId
          });
        }
      }
      
      await executeQuery('COMMIT');
      
      // Return updated policies
      const query = `
        SELECT 
          policy_key,
          policy_value,
          policy_type
        FROM system_policies
        WHERE is_active = 1
      `;
      
      const result = await executeQuery(query);
      
      const updatedPolicies = {};
      result.forEach(row => {
        let value = row.policy_value;
        
        if (row.policy_type === 'boolean') {
          value = value === 'true' || value === '1';
        } else if (row.policy_type === 'number') {
          value = parseFloat(value);
        }
        
        updatedPolicies[row.policy_key] = value;
      });
      
      res.json(ApiResponse.success(updatedPolicies, 'Políticas actualizadas correctamente'));
      
    } catch (error) {
      await executeQuery('ROLLBACK');
      throw error;
    }
  })
);

module.exports = router;