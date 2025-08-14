const { Quotation, QuotationItem, QuotationMounting, Customer, Project, 
        Zone, Piece, PiecePrice } = require('../../../shared/database/models');
const { AppError, catchAsync, ApiResponse } = require('../../../shared/utils');
const { Op } = require('sequelize');
const { logCrud } = require('../../admin/services/auditLogger.service');
const { calculateQuotationTotals } = require('../services/quotationCalc.service');

class QuotationController {
  // Crear nuevo presupuesto
  createQuotation = catchAsync(async (req, res) => {
    const {
      projectId,
      customerId,
      companyId,
      productionZoneId,
      description,
      deliveryTerms,
      paymentTerms,
      generalExpensesPercentage = 15,
      profitPercentage = 10,
      taxRate = 21,
      items = [], // Array de items del presupuesto
      mountingItems = [], // Array de items de montaje
      notes
    } = req.body;

    // Verificar que el proyecto y cliente existan
    const [project, customer, zone] = await Promise.all([
      Project.findByPk(projectId),
      Customer.findByPk(customerId),
      Zone.findByPk(productionZoneId)
    ]);

    if (!project) throw new AppError('Proyecto no encontrado', 404);
    if (!customer) throw new AppError('Cliente no encontrado', 404);
    if (!zone) throw new AppError('Zona de producción no encontrada', 404);

    // Crear el presupuesto
    const quotation = await Quotation.create({
      project_id: projectId,
      customer_id: customerId,
      company_id: companyId,
      vendor_id: req.user.id,
      production_zone_id: productionZoneId,
      description,
      delivery_terms: deliveryTerms,
      payment_terms: paymentTerms,
      general_expenses_percentage: generalExpensesPercentage,
      profit_percentage: profitPercentage,
      tax_rate: taxRate,
      quotation_date: new Date(),
      notes
    });

    // Agregar items del presupuesto
    for (const [index, item] of items.entries()) {
      const piece = await Piece.findByPk(item.pieceId);
      if (!piece) {
        throw new AppError(`Pieza con ID ${item.pieceId} no encontrada`, 404);
      }

      // Obtener precio actual de la pieza para la zona
      const piecePrice = await PiecePrice.getCurrentPrice(item.pieceId, productionZoneId);
      if (!piecePrice) {
        throw new AppError(`No hay precio definido para la pieza ${piece.name} en la zona ${zone.name}`, 400);
      }

      await QuotationItem.create({
        quotation_id: quotation.id,
        piece_id: item.pieceId,
        display_order: index,
        description: item.description || piece.name,
        quantity: item.quantity,
        length: item.length || 0,
        width: item.width || 0,
        height: item.height || 0,
        unit_price: piecePrice.final_price,
        price_adjustment: item.priceAdjustment || 0,
        weight: piece.weight * item.quantity,
        is_optional: item.isOptional || false,
        notes: item.notes
      });
    }

    // Agregar items de montaje
    for (const mountItem of mountingItems) {
      await QuotationMounting.create({
        quotation_id: quotation.id,
        description: mountItem.description,
        unit: mountItem.unit,
        quantity: mountItem.quantity,
        unit_price: mountItem.unitPrice,
        notes: mountItem.notes
      });
    }

    // Calcular totales
    await quotation.calculateTotals();

    // Recargar con relaciones
    const fullQuotation = await Quotation.findByPk(quotation.id, {
      include: [
        { model: QuotationItem, as: 'items' },
        { model: QuotationMounting, as: 'mountingItems' },
        { model: Zone, as: 'productionZone' },
        { model: Customer, as: 'customer' }
      ]
    });

    try { logCrud({ userId: req.user?.id, entity: 'quotations', entityId: quotation.id, action: 'create', data: { total: fullQuotation.total } }); } catch (_) {}
    return res.status(201).json(
      ApiResponse.success(fullQuotation, 'Presupuesto creado exitosamente')
    );
  });

  // Obtener todos los presupuestos
  getAllQuotations = catchAsync(async (req, res) => {
    const { 
      status, 
      customerId, 
      projectId,
      dateFrom,
      dateTo,
      page = 1, 
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    const whereClause = {};
    
    if (status) whereClause.status = status;
    if (customerId) whereClause.customer_id = customerId;
    if (projectId) whereClause.project_id = projectId;
    
    if (dateFrom || dateTo) {
      whereClause.created_at = {};
      if (dateFrom) whereClause.created_at[Op.gte] = new Date(dateFrom);
      if (dateTo) whereClause.created_at[Op.lte] = new Date(dateTo);
    }

    const offset = (page - 1) * limit;

    try {
      const quotations = await Quotation.findAndCountAll({
        where: whereClause,
        include: [
          { 
            model: Customer, 
            as: 'customer', 
            attributes: ['id', 'name'],
            required: false 
          },
          { 
            model: Project, 
            as: 'project', 
            attributes: ['id', 'name'],
            required: false 
          },
          { 
            model: Zone, 
            as: 'productionZone', 
            attributes: ['id', 'code', 'name'],
            required: false 
          }
        ],
        limit: parseInt(limit),
        offset: offset,
        order: [[sort_by, sort_order]],
        distinct: true
      });

      return res.json(
        ApiResponse.success({
          quotations: quotations.rows,
          pagination: {
            total: quotations.count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(quotations.count / limit)
          }
        })
      );

    } catch (error) {
      console.error('Error in getAllQuotations:', error);
      
      // Si falla con includes, intentar sin ellos
      const quotations = await Quotation.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [[sort_by, sort_order]],
        attributes: [
          'id', 'customer_id', 'project_id', 'production_zone_id',
          'status', 'total', 'description', 'created_at', 'updated_at'
        ]
      });

      return res.json(
        ApiResponse.success({
          quotations: quotations.rows,
          pagination: {
            total: quotations.count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(quotations.count / limit)
          }
        })
      );
    }
  });

  // Obtener un presupuesto específico
  getQuotationById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const quotation = await Quotation.findByPk(id, {
      include: [
        { 
          model: QuotationItem, 
          as: 'items',
          include: [{ model: Piece, as: 'piece' }]
        },
        { model: QuotationMounting, as: 'mountingItems' },
        { model: Zone, as: 'productionZone' },
        { model: Customer, as: 'customer' },
        { model: Project, as: 'project' }
      ]
    });

    if (!quotation) {
      throw new AppError('Presupuesto no encontrado', 404);
    }

    res.json({
      success: true,
      data: quotation
    });
  });

  // Actualizar presupuesto
  updateQuotation = catchAsync(async (req, res) => {
    const { id } = req.params;
    const {
      description,
      deliveryTerms,
      paymentTerms,
      generalExpensesPercentage,
      profitPercentage,
      taxRate,
      status,
      notes
    } = req.body;

    const quotation = await Quotation.findByPk(id);

    if (!quotation) {
      throw new AppError('Presupuesto no encontrado', 404);
    }

    // No permitir editar presupuestos aprobados
    if (quotation.status === 'approved') {
      throw new AppError('No se puede editar un presupuesto aprobado', 400);
    }

    await quotation.update({
      description,
      delivery_terms: deliveryTerms,
      payment_terms: paymentTerms,
      general_expenses_percentage: generalExpensesPercentage,
      profit_percentage: profitPercentage,
      tax_rate: taxRate,
      status,
      notes
    });

    // Recalcular totales si se cambiaron los porcentajes
    if (generalExpensesPercentage || profitPercentage || taxRate) {
      await quotation.calculateTotals();
    }

    try { logCrud({ userId: req.user?.id, entity: 'quotations', entityId: quotation.id, action: 'update' }); } catch (_) {}
    res.json({
      success: true,
      message: 'Presupuesto actualizado exitosamente',
      data: quotation
    });
  });

  // Duplicar presupuesto (crear nueva versión)
  duplicateQuotation = catchAsync(async (req, res) => {
    const { id } = req.params;

    const originalQuotation = await Quotation.findByPk(id, {
      include: [
        { model: QuotationItem, as: 'items' },
        { model: QuotationMounting, as: 'mountingItems' }
      ]
    });

    if (!originalQuotation) {
      throw new AppError('Presupuesto no encontrado', 404);
    }

    // Crear nueva versión
    const newVersion = originalQuotation.version + 1;

    // Crear copia del presupuesto
    const newQuotation = await Quotation.create({
      project_id: originalQuotation.project_id,
      version: newVersion,
      customer_id: originalQuotation.customer_id,
      company_id: originalQuotation.company_id,
      vendor_id: req.user.id,
      production_zone_id: originalQuotation.production_zone_id,
      status: 'draft',
      description: originalQuotation.description,
      delivery_terms: originalQuotation.delivery_terms,
      payment_terms: originalQuotation.payment_terms,
      general_expenses_percentage: originalQuotation.general_expenses_percentage,
      profit_percentage: originalQuotation.profit_percentage,
      tax_rate: originalQuotation.tax_rate,
      quotation_date: new Date(),
      notes: `Versión ${newVersion} - Basado en presupuesto #${originalQuotation.id}`
    });

    // Copiar items
    for (const item of originalQuotation.items) {
      await QuotationItem.create({
        quotation_id: newQuotation.id,
        piece_id: item.piece_id,
        display_order: item.display_order,
        description: item.description,
        quantity: item.quantity,
        length: item.length,
        width: item.width,
        height: item.height,
        unit_price: item.unit_price,
        price_adjustment: item.price_adjustment,
        weight: item.weight,
        is_optional: item.is_optional,
        notes: item.notes
      });
    }

    // Copiar items de montaje
    for (const mountItem of originalQuotation.mountingItems) {
      await QuotationMounting.create({
        quotation_id: newQuotation.id,
        description: mountItem.description,
        unit: mountItem.unit,
        quantity: mountItem.quantity,
        unit_price: mountItem.unit_price,
        notes: mountItem.notes
      });
    }

    // Calcular totales
    await newQuotation.calculateTotals();

    return res.status(201).json(
      ApiResponse.success(newQuotation, 'Presupuesto duplicado exitosamente')
    );
  });

  // Aprobar presupuesto
  approveQuotation = catchAsync(async (req, res) => {
    const { id } = req.params;

    const quotation = await Quotation.findByPk(id);

    if (!quotation) {
      throw new AppError('Presupuesto no encontrado', 404);
    }

    if (quotation.status !== 'sent') {
      throw new AppError('Solo se pueden aprobar presupuestos enviados', 400);
    }

    await quotation.update({
      status: 'approved',
      sale_date: new Date()
    });

    res.json({
      success: true,
      message: 'Presupuesto aprobado exitosamente',
      data: quotation
    });
  });

  // Generar PDF del presupuesto
  generateQuotationPDF = catchAsync(async (req, res) => {
    const { id } = req.params;

    const quotation = await Quotation.findByPk(id, {
      include: [
        { 
          model: QuotationItem, 
          as: 'items',
          include: [{ model: Piece, as: 'piece' }]
        },
        { model: QuotationMounting, as: 'mountingItems' },
        { model: Zone, as: 'productionZone' },
        { model: Customer, as: 'customer' },
        { model: Project, as: 'project' },
        { model: Company, as: 'company' }
      ]
    });

    if (!quotation) {
      throw new AppError('Presupuesto no encontrado', 404);
    }

    // TODO: Implementar generación de PDF
    // Por ahora retornamos los datos que se usarían para el PDF
    res.json({
      success: true,
      message: 'Datos para PDF del presupuesto',
      data: quotation
    });
  });

  // Calcular totales completos (flujo Excel) para un presupuesto
  calculateTotalsExcel = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { distanceKm } = req.query;

    const result = await calculateQuotationTotals(id, { distanceKm: distanceKm ? parseFloat(distanceKm) : undefined });

    return res.json(
      ApiResponse.success(result, 'Cálculo completo realizado')
    );
  });
}

module.exports = new QuotationController();