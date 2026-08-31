#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/6494cd54351d290bff932426f74d5ddd6b909066cfc8de10b8e32aefe77583ea/contract';
import endContract from '../../snapshots/6494cd54351d290bff932426f74d5ddd6b909066cfc8de10b8e32aefe77583ea/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'audit_logs',
        columns: [
          col('action', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('ipAddress', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('metadata', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('resource', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('resourceId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('storeId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('userAgent', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'audit_logs_action_check_ff57f48c',
            "\"action\" IN ('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'APPROVE', 'CANCEL', 'REFUND', 'OPEN_SESSION', 'CLOSE_SESSION', 'STOCK_ADJUSTMENT', 'PAYMENT', 'OTHER')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'brands',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('slug', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'cash_movements',
        columns: [
          col('amount', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('reason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('referenceId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('referenceType', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('sessionId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'cash_movements_type_check_70231da3',
            "\"type\" IN ('OPENING_FLOAT', 'CASH_SALE', 'CASH_REFUND', 'CASH_IN', 'CASH_OUT', 'EXPENSE', 'SAFE_DEPOSIT', 'CASH_CORRECTION')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'cash_registers',
        columns: [
          col('code', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('ACTIVE'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('storeId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'cash_registers_status_check_53a667b7',
            "\"status\" IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'cash_session_closings',
        columns: [
          col('actualCash', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('closedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('difference', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('expectedCash', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('sessionId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('totalCash', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('totalCashIn', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('totalCashOut', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('totalRefunds', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('totalSales', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'cashier_sessions',
        columns: [
          col('actualAmount', 'numeric', { codecRef: { codecId: 'pg/numeric@1' } }),
          col('cashRegisterId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('cashierId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('closedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('difference', 'numeric', { codecRef: { codecId: 'pg/numeric@1' } }),
          col('expectedAmount', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('openedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('openingAmount', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('status', 'text', {
            notNull: true,
            default: lit('OPEN'),
            codecRef: { codecId: 'pg/text@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'cashier_sessions_status_check_f2895b18',
            "\"status\" IN ('OPEN', 'CLOSED', 'FORCE_CLOSED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'categories',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('parentId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('slug', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('ACTIVE'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'categories_status_check_23e8a19b',
            "\"status\" IN ('ACTIVE', 'INACTIVE', 'DISCONTINUED', 'ARCHIVED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'customer_addresses',
        columns: [
          col('address', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('city', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('customerId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('district', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('isDefault', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('label', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('landmark', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('latitude', 'numeric(10,7)', {
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 7 } },
          }),
          col('longitude', 'numeric(10,7)', {
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 7 } },
          }),
          col('phone', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('recipient', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'customers',
        columns: [
          col('companyName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('customerNo', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('email', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('firstName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('lastName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('phone', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('ACTIVE'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('storeId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('type', 'text', {
            notNull: true,
            default: lit('INDIVIDUAL'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'customers_status_check_6538c39b',
            "\"status\" IN ('ACTIVE', 'INACTIVE', 'BLOCKED', 'ARCHIVED')",
          ),
          checkExpression(
            'customers_type_check_abaaa1d9',
            "\"type\" IN ('INDIVIDUAL', 'BUSINESS')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'deliveries',
        columns: [
          col('addressId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('agentId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('assignedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('deliveredAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('deliveryFee', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('failedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('failureReason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('orderId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('pickedUpAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('scheduledAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('PENDING'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('storeId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'deliveries_failureReason_check_729f0c4e',
            "\"failureReason\" IN ('CUSTOMER_UNAVAILABLE', 'WRONG_ADDRESS', 'CUSTOMER_REFUSED', 'VEHICLE_PROBLEM', 'WEATHER', 'OTHER')",
          ),
          checkExpression(
            'deliveries_status_check_3b8959e6',
            "\"status\" IN ('PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'CANCELLED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'delivery_status_history',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('deliveryId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('note', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'delivery_status_history_status_check_3b8959e6',
            "\"status\" IN ('PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'CANCELLED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'goods_receipt_items',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('goodsReceiptId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('productId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('quantity', 'numeric(14,3)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 3 } },
          }),
          col('subtotal', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('unitCost', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'goods_receipts',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('purchaseOrderId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('receivedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('reference', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('DRAFT'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('storeId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'goods_receipts_status_check_f9f2b537',
            "\"status\" IN ('DRAFT', 'RECEIVED', 'CANCELLED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'inventory_count_items',
        columns: [
          col('countedQty', 'numeric(14,3)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 3 } },
          }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('difference', 'numeric(14,3)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 3 } },
          }),
          col('expectedQty', 'numeric(14,3)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 3 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('inventoryCountId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('productId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'inventory_counts',
        columns: [
          col('approvedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('approvedById', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('completedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('createdById', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('reference', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('startedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('DRAFT'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('storeId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'inventory_counts_status_check_b7c6fee5',
            "\"status\" IN ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'APPROVED', 'CANCELLED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'invoices',
        columns: [
          col('customerEmail', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('customerName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('customerPhone', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('discount', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('dueAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('invoiceNo', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('issuedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('orderId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('pdfUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('ISSUED'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('subtotal', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('tax', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('total', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('type', 'text', {
            notNull: true,
            default: lit('SALE'),
            codecRef: { codecId: 'pg/text@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'invoices_status_check_8b9b9661',
            "\"status\" IN ('ISSUED', 'CANCELLED')",
          ),
          checkExpression('invoices_type_check_65e8ab6b', "\"type\" IN ('SALE', 'CREDIT_NOTE')"),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'order_items',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('discountAmount', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('orderId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('productId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('productName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('quantity', 'numeric(14,3)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 3 } },
          }),
          col('sku', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('PENDING'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('subtotal', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('taxRate', 'numeric(5,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 5, scale: 2 } },
          }),
          col('totalAmount', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('unitPrice', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'order_items_status_check_1dd49a87',
            "\"status\" IN ('PENDING', 'PREPARED', 'CANCELLED', 'FULFILLED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'orders',
        columns: [
          col('cancelledAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('channel', 'text', {
            notNull: true,
            default: lit('POS'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('completedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('confirmedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('createdById', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('customerId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('deliveryFee', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('discountAmount', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('fulfillment', 'text', {
            notNull: true,
            default: lit('IN_STORE'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('reference', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('DRAFT'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('storeId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('subtotal', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('taxAmount', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('totalAmount', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'orders_channel_check_d9ceddbe',
            "\"channel\" IN ('POS', 'DESKTOP', 'MOBILE', 'WEB', 'PHONE')",
          ),
          checkExpression(
            'orders_fulfillment_check_8635b768',
            "\"fulfillment\" IN ('IN_STORE', 'PICKUP', 'DELIVERY')",
          ),
          checkExpression(
            'orders_status_check_af47075e',
            "\"status\" IN ('DRAFT', 'PENDING', 'CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED', 'REFUNDED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'organizations',
        columns: [
          col('address', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('city', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('country', 'text', {
            notNull: true,
            default: lit('CG'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('currency', 'text', {
            notNull: true,
            default: lit('XAF'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('email', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('legalName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('phone', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('slug', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('ACTIVE'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'organizations_status_check_0f44f6b1',
            "\"status\" IN ('ACTIVE', 'SUSPENDED', 'ARCHIVED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'payments',
        columns: [
          col('amount', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('currency', 'text', {
            notNull: true,
            default: lit('XAF'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('direction', 'text', {
            notNull: true,
            default: lit('IN'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('failureReason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('metadata', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('method', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('orderId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('paidAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('providerRef', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('reference', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('saleId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('sessionId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('PENDING'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('transactionRef', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('payments_direction_check_9050e2ee', "\"direction\" IN ('IN', 'OUT')"),
          checkExpression(
            'payments_method_check_3653ad49',
            "\"method\" IN ('CASH', 'MTN_MOMO', 'AIRTEL_MONEY', 'CARD', 'BANK_TRANSFER', 'OTHER')",
          ),
          checkExpression(
            'payments_status_check_42b5bafd',
            "\"status\" IN ('PENDING', 'PROCESSING', 'CONFIRMED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'permissions',
        columns: [
          col('action', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('resource', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'permissions_action_check_f5a11376',
            "\"action\" IN ('CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'CANCEL', 'REFUND', 'EXPORT', 'PRINT', 'OPEN', 'CLOSE', 'ADJUST', 'TRANSFER')",
          ),
          checkExpression(
            'permissions_resource_check_0aea9eaf',
            "\"resource\" IN ('USERS', 'ROLES', 'PERMISSIONS', 'ORGANIZATIONS', 'STORES', 'PRODUCTS', 'CATEGORIES', 'BRANDS', 'PRICES', 'SUPPLIERS', 'PURCHASE_ORDERS', 'GOODS_RECEIPTS', 'STOCK', 'INVENTORIES', 'CUSTOMERS', 'ORDERS', 'SALES', 'CASH_REGISTERS', 'CASH_SESSIONS', 'CASH_MOVEMENTS', 'PAYMENTS', 'RECEIPTS', 'INVOICES', 'DELIVERIES', 'REPORTS', 'AUDIT_LOGS')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'product_barcodes',
        columns: [
          col('barcode', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('isPrimary', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('productId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'product_images',
        columns: [
          col('altText', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('productId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('sortOrder', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('url', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'product_prices',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('productId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('sellingPrice', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('storeId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('validFrom', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('validUntil', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'products',
        columns: [
          col('brandId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('categoryId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('costPrice', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('imageUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('maximumStock', 'numeric', { codecRef: { codecId: 'pg/numeric@1' } }),
          col('minimumStock', 'numeric(14,3)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 3 } },
          }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('productType', 'text', {
            notNull: true,
            default: lit('STANDARD'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('reorderLevel', 'numeric(14,3)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 3 } },
          }),
          col('sku', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('slug', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('ACTIVE'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('taxRate', 'numeric(5,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 5, scale: 2 } },
          }),
          col('unitType', 'text', {
            notNull: true,
            default: lit('PIECE'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'products_productType_check_d02b8373',
            "\"productType\" IN ('STANDARD', 'WEIGHTED', 'SERVICE', 'COMBO')",
          ),
          checkExpression(
            'products_status_check_23e8a19b',
            "\"status\" IN ('ACTIVE', 'INACTIVE', 'DISCONTINUED', 'ARCHIVED')",
          ),
          checkExpression(
            'products_unitType_check_6202931f',
            "\"unitType\" IN ('PIECE', 'KILOGRAM', 'GRAM', 'LITER', 'MILLILITER', 'METER', 'PACK', 'BOX', 'BOTTLE', 'CAN')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'purchase_order_items',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('productId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('purchaseOrderId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('quantity', 'numeric(14,3)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 3 } },
          }),
          col('subtotal', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('taxRate', 'numeric(5,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 5, scale: 2 } },
          }),
          col('unitCost', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'purchase_orders',
        columns: [
          col('approvedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('approvedById', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('createdById', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('expectedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('orderedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('reference', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('DRAFT'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('storeId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('subtotal', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('supplierId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('taxAmount', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('totalAmount', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'purchase_orders_status_check_255dd532',
            "\"status\" IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED', 'CLOSED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'receipts',
        columns: [
          col('discount', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('issuedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('orderId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('pdfUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('receiptNo', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('ISSUED'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('subtotal', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('tax', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('total', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('type', 'text', {
            notNull: true,
            default: lit('SALE'),
            codecRef: { codecId: 'pg/text@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'receipts_status_check_8b9b9661',
            "\"status\" IN ('ISSUED', 'CANCELLED')",
          ),
          checkExpression('receipts_type_check_594594fb', "\"type\" IN ('SALE', 'REFUND')"),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'role_permissions',
        columns: [
          col('permissionId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('roleId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['roleId', 'permissionId'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'roles',
        columns: [
          col('code', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('isSystem', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'roles_code_check_7add84f3',
            "\"code\" IN ('SUPER_ADMIN', 'ADMIN', 'STORE_MANAGER', 'CASHIER', 'STOCK_MANAGER', 'PURCHASING_MANAGER', 'SALES_MANAGER', 'ACCOUNTANT', 'DELIVERY_AGENT', 'AUDITOR', 'CUSTOMER')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'sale_items',
        columns: [
          col('discountAmount', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('productId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('productName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('quantity', 'numeric(14,3)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 3 } },
          }),
          col('saleId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('sku', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('taxAmount', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('totalAmount', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('unitPrice', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'sales',
        columns: [
          col('discountAmount', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('orderId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('reference', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('sessionId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('soldAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('storeId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('subtotal', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('taxAmount', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
          col('totalAmount', 'numeric(14,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'stock_adjustment_items',
        columns: [
          col('difference', 'numeric(14,3)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 3 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('newQuantity', 'numeric(14,3)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 3 } },
          }),
          col('previousQuantity', 'numeric(14,3)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 3 } },
          }),
          col('productId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('reason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('stockAdjustmentId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'stock_adjustments',
        columns: [
          col('appliedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('approvedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('approvedById', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('createdById', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('reason', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('reference', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('DRAFT'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('storeId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'stock_adjustments_status_check_f070967a',
            "\"status\" IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'APPLIED', 'CANCELLED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'stock_movements',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('previousQty', 'numeric(14,3)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 3 } },
          }),
          col('productId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('quantity', 'numeric(14,3)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 3 } },
          }),
          col('referenceId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('referenceType', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('resultingQty', 'numeric(14,3)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 3 } },
          }),
          col('storeId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('unitCost', 'numeric(14,2)', {
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'stock_movements_type_check_88dcb16b',
            "\"type\" IN ('PURCHASE_RECEIPT', 'SALE', 'SALE_RETURN', 'PURCHASE_RETURN', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'TRANSFER_IN', 'TRANSFER_OUT', 'INVENTORY_CORRECTION', 'DAMAGED', 'EXPIRED', 'LOST')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'stocks',
        columns: [
          col('availableQty', 'numeric(14,3)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 3 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('productId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('quantity', 'numeric(14,3)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 3 } },
          }),
          col('reservedQty', 'numeric(14,3)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 3 } },
          }),
          col('storeId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'store_users',
        columns: [
          col('assignedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('storeId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('userId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['storeId', 'userId'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'stores',
        columns: [
          col('address', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('city', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('code', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('email', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('organizationId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('phone', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('ACTIVE'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'stores_status_check_0255d779',
            "\"status\" IN ('ACTIVE', 'TEMPORARILY_CLOSED', 'SUSPENDED', 'CLOSED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'suppliers',
        columns: [
          col('address', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('city', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('code', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('contactName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('email', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('phone', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('ACTIVE'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('taxNumber', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'suppliers_status_check_6538c39b',
            "\"status\" IN ('ACTIVE', 'INACTIVE', 'BLOCKED', 'ARCHIVED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'user_roles',
        columns: [
          col('assignedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('roleId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('userId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['userId', 'roleId'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'users',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('displayName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('firstName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('lastLoginAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('lastName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('passwordChangedAt', 'timestamptz', {
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('passwordHash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('phone', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('ACTIVE'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'users_status_check_4eeaa737',
            "\"status\" IN ('ACTIVE', 'INVITED', 'SUSPENDED', 'BLOCKED', 'INACTIVE', 'ARCHIVED')",
          ),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'brands',
        constraint: 'brands_name_key',
        columns: ['name'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'brands',
        constraint: 'brands_slug_key',
        columns: ['slug'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'cash_registers',
        constraint: 'cash_registers_storeId_code_key',
        columns: ['storeId', 'code'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'cash_session_closings',
        constraint: 'cash_session_closings_sessionId_key',
        columns: ['sessionId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'categories',
        constraint: 'categories_slug_key',
        columns: ['slug'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'customers',
        constraint: 'customers_storeId_customerNo_key',
        columns: ['storeId', 'customerNo'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'deliveries',
        constraint: 'deliveries_orderId_key',
        columns: ['orderId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'goods_receipts',
        constraint: 'goods_receipts_reference_key',
        columns: ['reference'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'inventory_count_items',
        constraint: 'inventory_count_items_inventoryCountId_productId_key',
        columns: ['inventoryCountId', 'productId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'inventory_counts',
        constraint: 'inventory_counts_reference_key',
        columns: ['reference'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'invoices',
        constraint: 'invoices_orderId_key',
        columns: ['orderId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'invoices',
        constraint: 'invoices_invoiceNo_key',
        columns: ['invoiceNo'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'orders',
        constraint: 'orders_reference_key',
        columns: ['reference'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'organizations',
        constraint: 'organizations_slug_key',
        columns: ['slug'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'payments',
        constraint: 'payments_reference_key',
        columns: ['reference'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'permissions',
        constraint: 'permissions_resource_action_key',
        columns: ['resource', 'action'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'product_barcodes',
        constraint: 'product_barcodes_barcode_key',
        columns: ['barcode'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'products',
        constraint: 'products_sku_key',
        columns: ['sku'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'products',
        constraint: 'products_slug_key',
        columns: ['slug'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'purchase_orders',
        constraint: 'purchase_orders_reference_key',
        columns: ['reference'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'receipts',
        constraint: 'receipts_orderId_key',
        columns: ['orderId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'receipts',
        constraint: 'receipts_receiptNo_key',
        columns: ['receiptNo'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'roles',
        constraint: 'roles_code_key',
        columns: ['code'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'sales',
        constraint: 'sales_orderId_key',
        columns: ['orderId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'sales',
        constraint: 'sales_reference_key',
        columns: ['reference'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'stock_adjustments',
        constraint: 'stock_adjustments_reference_key',
        columns: ['reference'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'stocks',
        constraint: 'stocks_storeId_productId_key',
        columns: ['storeId', 'productId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'stores',
        constraint: 'stores_organizationId_code_key',
        columns: ['organizationId', 'code'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'suppliers',
        constraint: 'suppliers_code_key',
        columns: ['code'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'users',
        constraint: 'users_email_key',
        columns: ['email'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'users',
        constraint: 'users_phone_key',
        columns: ['phone'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'audit_logs',
        index: 'audit_logs_action_createdAt_idx_a6d20b4b',
        columns: ['action', 'createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'audit_logs',
        index: 'audit_logs_resource_resourceId_idx_d779a931',
        columns: ['resource', 'resourceId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'audit_logs',
        index: 'audit_logs_storeId_createdAt_idx_5391ab5d',
        columns: ['storeId', 'createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'audit_logs',
        index: 'audit_logs_storeId_idx_c545737d',
        columns: ['storeId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'audit_logs',
        index: 'audit_logs_userId_createdAt_idx_f726f04a',
        columns: ['userId', 'createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'audit_logs',
        index: 'audit_logs_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'cash_movements',
        index: 'cash_movements_referenceType_referenceId_idx_d11658f3',
        columns: ['referenceType', 'referenceId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'cash_movements',
        index: 'cash_movements_sessionId_createdAt_idx_9c04f880',
        columns: ['sessionId', 'createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'cash_movements',
        index: 'cash_movements_sessionId_idx_29f415d4',
        columns: ['sessionId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'cash_registers',
        index: 'cash_registers_storeId_idx_c545737d',
        columns: ['storeId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'cash_registers',
        index: 'cash_registers_storeId_status_idx_81db0ee8',
        columns: ['storeId', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'cashier_sessions',
        index: 'cashier_sessions_cashRegisterId_idx_92ddd6b0',
        columns: ['cashRegisterId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'cashier_sessions',
        index: 'cashier_sessions_cashRegisterId_status_idx_98b9a4f8',
        columns: ['cashRegisterId', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'cashier_sessions',
        index: 'cashier_sessions_cashierId_idx_f55c4cfd',
        columns: ['cashierId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'cashier_sessions',
        index: 'cashier_sessions_cashierId_status_idx_fa23b99f',
        columns: ['cashierId', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'categories',
        index: 'categories_parentId_idx_6a68f597',
        columns: ['parentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'categories',
        index: 'categories_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'customer_addresses',
        index: 'customer_addresses_customerId_idx_b2a8a46c',
        columns: ['customerId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'customers',
        index: 'customers_email_idx_46df9cad',
        columns: ['email'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'customers',
        index: 'customers_phone_idx_8db23f45',
        columns: ['phone'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'customers',
        index: 'customers_storeId_idx_c545737d',
        columns: ['storeId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'customers',
        index: 'customers_storeId_status_idx_81db0ee8',
        columns: ['storeId', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'deliveries',
        index: 'deliveries_addressId_idx_a5ddb548',
        columns: ['addressId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'deliveries',
        index: 'deliveries_agentId_idx_8d0ba4f0',
        columns: ['agentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'deliveries',
        index: 'deliveries_agentId_status_idx_816a66ac',
        columns: ['agentId', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'deliveries',
        index: 'deliveries_storeId_idx_c545737d',
        columns: ['storeId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'deliveries',
        index: 'deliveries_storeId_status_idx_81db0ee8',
        columns: ['storeId', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'delivery_status_history',
        index: 'delivery_status_history_deliveryId_createdAt_idx_432caeb8',
        columns: ['deliveryId', 'createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'delivery_status_history',
        index: 'delivery_status_history_deliveryId_idx_ebc950f6',
        columns: ['deliveryId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'goods_receipt_items',
        index: 'goods_receipt_items_goodsReceiptId_idx_59cf72c4',
        columns: ['goodsReceiptId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'goods_receipt_items',
        index: 'goods_receipt_items_productId_idx_5858600a',
        columns: ['productId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'goods_receipts',
        index: 'goods_receipts_purchaseOrderId_idx_3e3a8c45',
        columns: ['purchaseOrderId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'goods_receipts',
        index: 'goods_receipts_storeId_idx_c545737d',
        columns: ['storeId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'goods_receipts',
        index: 'goods_receipts_storeId_status_idx_81db0ee8',
        columns: ['storeId', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'inventory_count_items',
        index: 'inventory_count_items_inventoryCountId_idx_b28af351',
        columns: ['inventoryCountId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'inventory_count_items',
        index: 'inventory_count_items_productId_idx_5858600a',
        columns: ['productId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'inventory_counts',
        index: 'inventory_counts_approvedById_idx_01ef8410',
        columns: ['approvedById'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'inventory_counts',
        index: 'inventory_counts_createdById_idx_8bf640ed',
        columns: ['createdById'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'inventory_counts',
        index: 'inventory_counts_storeId_idx_c545737d',
        columns: ['storeId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'inventory_counts',
        index: 'inventory_counts_storeId_status_idx_81db0ee8',
        columns: ['storeId', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'invoices',
        index: 'invoices_issuedAt_idx_a299a849',
        columns: ['issuedAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'order_items',
        index: 'order_items_orderId_idx_d284871b',
        columns: ['orderId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'order_items',
        index: 'order_items_productId_idx_5858600a',
        columns: ['productId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'orders',
        index: 'orders_createdById_idx_8bf640ed',
        columns: ['createdById'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'orders',
        index: 'orders_customerId_idx_b2a8a46c',
        columns: ['customerId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'orders',
        index: 'orders_storeId_idx_c545737d',
        columns: ['storeId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'orders',
        index: 'orders_storeId_status_createdAt_idx_aaf09d88',
        columns: ['storeId', 'status', 'createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'organizations',
        index: 'organizations_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'payments',
        index: 'payments_method_status_idx_dc1f05c0',
        columns: ['method', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'payments',
        index: 'payments_orderId_idx_d284871b',
        columns: ['orderId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'payments',
        index: 'payments_orderId_status_idx_ec049a01',
        columns: ['orderId', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'payments',
        index: 'payments_saleId_idx_b4c0fb73',
        columns: ['saleId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'payments',
        index: 'payments_saleId_status_idx_37c1ee7d',
        columns: ['saleId', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'payments',
        index: 'payments_sessionId_createdAt_idx_9c04f880',
        columns: ['sessionId', 'createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'payments',
        index: 'payments_sessionId_idx_29f415d4',
        columns: ['sessionId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'payments',
        index: 'payments_transactionRef_idx_6b7fe400',
        columns: ['transactionRef'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'product_barcodes',
        index: 'product_barcodes_productId_idx_5858600a',
        columns: ['productId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'product_images',
        index: 'product_images_productId_idx_5858600a',
        columns: ['productId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'product_prices',
        index: 'product_prices_productId_idx_5858600a',
        columns: ['productId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'product_prices',
        index: 'product_prices_productId_storeId_idx_420cde0c',
        columns: ['productId', 'storeId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'product_prices',
        index: 'product_prices_storeId_idx_c545737d',
        columns: ['storeId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'product_prices',
        index: 'product_prices_storeId_validFrom_idx_4335d11f',
        columns: ['storeId', 'validFrom'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'products',
        index: 'products_brandId_idx_02e95397',
        columns: ['brandId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'products',
        index: 'products_categoryId_idx_15c304f2',
        columns: ['categoryId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'products',
        index: 'products_name_idx_ce87e6ba',
        columns: ['name'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'products',
        index: 'products_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'purchase_order_items',
        index: 'purchase_order_items_productId_idx_5858600a',
        columns: ['productId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'purchase_order_items',
        index: 'purchase_order_items_purchaseOrderId_idx_3e3a8c45',
        columns: ['purchaseOrderId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'purchase_orders',
        index: 'purchase_orders_approvedById_idx_01ef8410',
        columns: ['approvedById'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'purchase_orders',
        index: 'purchase_orders_createdById_idx_8bf640ed',
        columns: ['createdById'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'purchase_orders',
        index: 'purchase_orders_storeId_idx_c545737d',
        columns: ['storeId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'purchase_orders',
        index: 'purchase_orders_storeId_status_idx_81db0ee8',
        columns: ['storeId', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'purchase_orders',
        index: 'purchase_orders_supplierId_idx_c4d9a8b9',
        columns: ['supplierId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'receipts',
        index: 'receipts_issuedAt_idx_a299a849',
        columns: ['issuedAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'role_permissions',
        index: 'role_permissions_permissionId_idx_f46fcdf5',
        columns: ['permissionId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'role_permissions',
        index: 'role_permissions_roleId_idx_ffccc9a4',
        columns: ['roleId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'sale_items',
        index: 'sale_items_productId_idx_5858600a',
        columns: ['productId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'sale_items',
        index: 'sale_items_saleId_idx_b4c0fb73',
        columns: ['saleId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'sales',
        index: 'sales_sessionId_idx_29f415d4',
        columns: ['sessionId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'sales',
        index: 'sales_sessionId_soldAt_idx_51e25603',
        columns: ['sessionId', 'soldAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'sales',
        index: 'sales_storeId_idx_c545737d',
        columns: ['storeId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'sales',
        index: 'sales_storeId_soldAt_idx_0df24097',
        columns: ['storeId', 'soldAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'stock_adjustment_items',
        index: 'stock_adjustment_items_productId_idx_5858600a',
        columns: ['productId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'stock_adjustment_items',
        index: 'stock_adjustment_items_stockAdjustmentId_idx_5d4545ca',
        columns: ['stockAdjustmentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'stock_adjustments',
        index: 'stock_adjustments_approvedById_idx_01ef8410',
        columns: ['approvedById'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'stock_adjustments',
        index: 'stock_adjustments_createdById_idx_8bf640ed',
        columns: ['createdById'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'stock_adjustments',
        index: 'stock_adjustments_storeId_idx_c545737d',
        columns: ['storeId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'stock_adjustments',
        index: 'stock_adjustments_storeId_status_idx_81db0ee8',
        columns: ['storeId', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'stock_movements',
        index: 'stock_movements_productId_createdAt_idx_58d1a09b',
        columns: ['productId', 'createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'stock_movements',
        index: 'stock_movements_productId_idx_5858600a',
        columns: ['productId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'stock_movements',
        index: 'stock_movements_referenceType_referenceId_idx_d11658f3',
        columns: ['referenceType', 'referenceId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'stock_movements',
        index: 'stock_movements_storeId_createdAt_idx_5391ab5d',
        columns: ['storeId', 'createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'stock_movements',
        index: 'stock_movements_storeId_idx_c545737d',
        columns: ['storeId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'stocks',
        index: 'stocks_productId_idx_5858600a',
        columns: ['productId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'stocks',
        index: 'stocks_storeId_idx_c545737d',
        columns: ['storeId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'store_users',
        index: 'store_users_storeId_idx_c545737d',
        columns: ['storeId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'store_users',
        index: 'store_users_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'stores',
        index: 'stores_organizationId_idx_2e17ef41',
        columns: ['organizationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'stores',
        index: 'stores_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'suppliers',
        index: 'suppliers_name_idx_ce87e6ba',
        columns: ['name'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'suppliers',
        index: 'suppliers_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'user_roles',
        index: 'user_roles_roleId_idx_ffccc9a4',
        columns: ['roleId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'user_roles',
        index: 'user_roles_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'users',
        index: 'users_lastName_firstName_idx_3659da4b',
        columns: ['lastName', 'firstName'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'users',
        index: 'users_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'audit_logs',
        foreignKey: {
          name: 'audit_logs_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'audit_logs',
        foreignKey: {
          name: 'audit_logs_storeId_fkey',
          columns: ['storeId'],
          references: { schema: 'public', table: 'stores', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'cash_movements',
        foreignKey: {
          name: 'cash_movements_sessionId_fkey',
          columns: ['sessionId'],
          references: { schema: 'public', table: 'cashier_sessions', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'cash_registers',
        foreignKey: {
          name: 'cash_registers_storeId_fkey',
          columns: ['storeId'],
          references: { schema: 'public', table: 'stores', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'cash_session_closings',
        foreignKey: {
          name: 'cash_session_closings_sessionId_fkey',
          columns: ['sessionId'],
          references: { schema: 'public', table: 'cashier_sessions', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'cashier_sessions',
        foreignKey: {
          name: 'cashier_sessions_cashRegisterId_fkey',
          columns: ['cashRegisterId'],
          references: { schema: 'public', table: 'cash_registers', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'cashier_sessions',
        foreignKey: {
          name: 'cashier_sessions_cashierId_fkey',
          columns: ['cashierId'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'categories',
        foreignKey: {
          name: 'categories_parentId_fkey',
          columns: ['parentId'],
          references: { schema: 'public', table: 'categories', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'customer_addresses',
        foreignKey: {
          name: 'customer_addresses_customerId_fkey',
          columns: ['customerId'],
          references: { schema: 'public', table: 'customers', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'customers',
        foreignKey: {
          name: 'customers_storeId_fkey',
          columns: ['storeId'],
          references: { schema: 'public', table: 'stores', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'deliveries',
        foreignKey: {
          name: 'deliveries_orderId_fkey',
          columns: ['orderId'],
          references: { schema: 'public', table: 'orders', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'deliveries',
        foreignKey: {
          name: 'deliveries_storeId_fkey',
          columns: ['storeId'],
          references: { schema: 'public', table: 'stores', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'deliveries',
        foreignKey: {
          name: 'deliveries_addressId_fkey',
          columns: ['addressId'],
          references: { schema: 'public', table: 'customer_addresses', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'deliveries',
        foreignKey: {
          name: 'deliveries_agentId_fkey',
          columns: ['agentId'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'delivery_status_history',
        foreignKey: {
          name: 'delivery_status_history_deliveryId_fkey',
          columns: ['deliveryId'],
          references: { schema: 'public', table: 'deliveries', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'goods_receipt_items',
        foreignKey: {
          name: 'goods_receipt_items_goodsReceiptId_fkey',
          columns: ['goodsReceiptId'],
          references: { schema: 'public', table: 'goods_receipts', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'goods_receipt_items',
        foreignKey: {
          name: 'goods_receipt_items_productId_fkey',
          columns: ['productId'],
          references: { schema: 'public', table: 'products', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'goods_receipts',
        foreignKey: {
          name: 'goods_receipts_storeId_fkey',
          columns: ['storeId'],
          references: { schema: 'public', table: 'stores', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'goods_receipts',
        foreignKey: {
          name: 'goods_receipts_purchaseOrderId_fkey',
          columns: ['purchaseOrderId'],
          references: { schema: 'public', table: 'purchase_orders', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'inventory_count_items',
        foreignKey: {
          name: 'inventory_count_items_inventoryCountId_fkey',
          columns: ['inventoryCountId'],
          references: { schema: 'public', table: 'inventory_counts', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'inventory_count_items',
        foreignKey: {
          name: 'inventory_count_items_productId_fkey',
          columns: ['productId'],
          references: { schema: 'public', table: 'products', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'inventory_counts',
        foreignKey: {
          name: 'inventory_counts_storeId_fkey',
          columns: ['storeId'],
          references: { schema: 'public', table: 'stores', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'inventory_counts',
        foreignKey: {
          name: 'inventory_counts_createdById_fkey',
          columns: ['createdById'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'inventory_counts',
        foreignKey: {
          name: 'inventory_counts_approvedById_fkey',
          columns: ['approvedById'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'invoices',
        foreignKey: {
          name: 'invoices_orderId_fkey',
          columns: ['orderId'],
          references: { schema: 'public', table: 'orders', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'order_items',
        foreignKey: {
          name: 'order_items_orderId_fkey',
          columns: ['orderId'],
          references: { schema: 'public', table: 'orders', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'order_items',
        foreignKey: {
          name: 'order_items_productId_fkey',
          columns: ['productId'],
          references: { schema: 'public', table: 'products', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'orders',
        foreignKey: {
          name: 'orders_storeId_fkey',
          columns: ['storeId'],
          references: { schema: 'public', table: 'stores', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'orders',
        foreignKey: {
          name: 'orders_customerId_fkey',
          columns: ['customerId'],
          references: { schema: 'public', table: 'customers', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'orders',
        foreignKey: {
          name: 'orders_createdById_fkey',
          columns: ['createdById'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'payments',
        foreignKey: {
          name: 'payments_orderId_fkey',
          columns: ['orderId'],
          references: { schema: 'public', table: 'orders', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'payments',
        foreignKey: {
          name: 'payments_saleId_fkey',
          columns: ['saleId'],
          references: { schema: 'public', table: 'sales', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'payments',
        foreignKey: {
          name: 'payments_sessionId_fkey',
          columns: ['sessionId'],
          references: { schema: 'public', table: 'cashier_sessions', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'product_barcodes',
        foreignKey: {
          name: 'product_barcodes_productId_fkey',
          columns: ['productId'],
          references: { schema: 'public', table: 'products', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'product_images',
        foreignKey: {
          name: 'product_images_productId_fkey',
          columns: ['productId'],
          references: { schema: 'public', table: 'products', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'product_prices',
        foreignKey: {
          name: 'product_prices_productId_fkey',
          columns: ['productId'],
          references: { schema: 'public', table: 'products', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'product_prices',
        foreignKey: {
          name: 'product_prices_storeId_fkey',
          columns: ['storeId'],
          references: { schema: 'public', table: 'stores', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'products',
        foreignKey: {
          name: 'products_categoryId_fkey',
          columns: ['categoryId'],
          references: { schema: 'public', table: 'categories', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'products',
        foreignKey: {
          name: 'products_brandId_fkey',
          columns: ['brandId'],
          references: { schema: 'public', table: 'brands', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'purchase_order_items',
        foreignKey: {
          name: 'purchase_order_items_purchaseOrderId_fkey',
          columns: ['purchaseOrderId'],
          references: { schema: 'public', table: 'purchase_orders', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'purchase_order_items',
        foreignKey: {
          name: 'purchase_order_items_productId_fkey',
          columns: ['productId'],
          references: { schema: 'public', table: 'products', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'purchase_orders',
        foreignKey: {
          name: 'purchase_orders_storeId_fkey',
          columns: ['storeId'],
          references: { schema: 'public', table: 'stores', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'purchase_orders',
        foreignKey: {
          name: 'purchase_orders_supplierId_fkey',
          columns: ['supplierId'],
          references: { schema: 'public', table: 'suppliers', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'purchase_orders',
        foreignKey: {
          name: 'purchase_orders_createdById_fkey',
          columns: ['createdById'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'purchase_orders',
        foreignKey: {
          name: 'purchase_orders_approvedById_fkey',
          columns: ['approvedById'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'receipts',
        foreignKey: {
          name: 'receipts_orderId_fkey',
          columns: ['orderId'],
          references: { schema: 'public', table: 'orders', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'role_permissions',
        foreignKey: {
          name: 'role_permissions_roleId_fkey',
          columns: ['roleId'],
          references: { schema: 'public', table: 'roles', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'role_permissions',
        foreignKey: {
          name: 'role_permissions_permissionId_fkey',
          columns: ['permissionId'],
          references: { schema: 'public', table: 'permissions', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'sale_items',
        foreignKey: {
          name: 'sale_items_saleId_fkey',
          columns: ['saleId'],
          references: { schema: 'public', table: 'sales', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'sale_items',
        foreignKey: {
          name: 'sale_items_productId_fkey',
          columns: ['productId'],
          references: { schema: 'public', table: 'products', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'sales',
        foreignKey: {
          name: 'sales_orderId_fkey',
          columns: ['orderId'],
          references: { schema: 'public', table: 'orders', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'sales',
        foreignKey: {
          name: 'sales_storeId_fkey',
          columns: ['storeId'],
          references: { schema: 'public', table: 'stores', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'sales',
        foreignKey: {
          name: 'sales_sessionId_fkey',
          columns: ['sessionId'],
          references: { schema: 'public', table: 'cashier_sessions', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'stock_adjustment_items',
        foreignKey: {
          name: 'stock_adjustment_items_stockAdjustmentId_fkey',
          columns: ['stockAdjustmentId'],
          references: { schema: 'public', table: 'stock_adjustments', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'stock_adjustment_items',
        foreignKey: {
          name: 'stock_adjustment_items_productId_fkey',
          columns: ['productId'],
          references: { schema: 'public', table: 'products', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'stock_adjustments',
        foreignKey: {
          name: 'stock_adjustments_storeId_fkey',
          columns: ['storeId'],
          references: { schema: 'public', table: 'stores', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'stock_adjustments',
        foreignKey: {
          name: 'stock_adjustments_createdById_fkey',
          columns: ['createdById'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'stock_adjustments',
        foreignKey: {
          name: 'stock_adjustments_approvedById_fkey',
          columns: ['approvedById'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'stock_movements',
        foreignKey: {
          name: 'stock_movements_storeId_fkey',
          columns: ['storeId'],
          references: { schema: 'public', table: 'stores', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'stock_movements',
        foreignKey: {
          name: 'stock_movements_productId_fkey',
          columns: ['productId'],
          references: { schema: 'public', table: 'products', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'stocks',
        foreignKey: {
          name: 'stocks_storeId_fkey',
          columns: ['storeId'],
          references: { schema: 'public', table: 'stores', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'stocks',
        foreignKey: {
          name: 'stocks_productId_fkey',
          columns: ['productId'],
          references: { schema: 'public', table: 'products', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'store_users',
        foreignKey: {
          name: 'store_users_storeId_fkey',
          columns: ['storeId'],
          references: { schema: 'public', table: 'stores', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'store_users',
        foreignKey: {
          name: 'store_users_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'stores',
        foreignKey: {
          name: 'stores_organizationId_fkey',
          columns: ['organizationId'],
          references: { schema: 'public', table: 'organizations', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'user_roles',
        foreignKey: {
          name: 'user_roles_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'user_roles',
        foreignKey: {
          name: 'user_roles_roleId_fkey',
          columns: ['roleId'],
          references: { schema: 'public', table: 'roles', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
