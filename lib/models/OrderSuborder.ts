import mongoose, { Schema, Document } from 'mongoose'

export interface IOrderSuborder extends Document {
  id: string
  order_id: string // String ID reference to Order (6-digit numeric string)
  vendor_id: string // String ID reference to Vendor (6-digit numeric string)
  vendor_indent_id?: string // String ID reference to VendorIndent (6-digit numeric string)
  // Shipping & Tracking (AUTHORITATIVE HERE)
  shipper_name?: string
  consignment_number?: string
  shipping_date?: Date
  shipment_status?: 'NOT_SHIPPED' | 'SHIPPED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED' | 'RETURNED'
  last_status_updated_at?: Date
  suborder_status: 'CREATED' | 'SHIPPED' | 'DELIVERED' | 'FAILED' | 'RETURNED'
  createdAt?: Date
  updatedAt?: Date
}

const OrderSuborderSchema = new Schema<IOrderSuborder>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    order_id: {
      type: String,
      required: true,
      validate: {
        validator: function(v: string) {
          return /^\d{6}$/.test(v)
        },
        message: 'Order ID must be a 6-digit numeric string'
      }
    },
    vendor_id: {
      type: String,
      required: true,
      validate: {
        validator: function(v: string) {
          return /^\d{6}$/.test(v)
        },
        message: 'Vendor ID must be a 6-digit numeric string (e.g., "100001")'
      }
    },
    vendor_indent_id: {
      type: String,
      required: false,
      validate: {
        validator: function(v: string) {
          return !v || /^\d{6}$/.test(v)
        },
        message: 'Vendor Indent ID must be a 6-digit numeric string'
      }
    },
    // Shipping & Tracking Fields
    shipper_name: {
      type: String,
      required: false,
      trim: true,
      maxlength: 100,
    },
    consignment_number: {
      type: String,
      required: false,
      trim: true,
      maxlength: 100,
      index: true,
    },
    shipping_date: {
      type: Date,
      required: false,
    },
    shipment_status: {
      type: String,
      enum: ['NOT_SHIPPED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'RETURNED'],
      default: 'NOT_SHIPPED',
      required: false,
      index: true,
    },
    last_status_updated_at: {
      type: Date,
      required: false,
    },
    suborder_status: {
      type: String,
      enum: ['CREATED', 'SHIPPED', 'DELIVERED', 'FAILED', 'RETURNED'],
      default: 'CREATED',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes for efficient queries
OrderSuborderSchema.index({ order_id: 1, vendor_id: 1 }, { unique: true }) // One suborder per vendor per order
OrderSuborderSchema.index({ order_id: 1, suborder_status: 1 })
OrderSuborderSchema.index({ vendor_id: 1, suborder_status: 1 })
OrderSuborderSchema.index({ vendor_indent_id: 1 })
OrderSuborderSchema.index({ consignment_number: 1 }, { sparse: true })

const OrderSuborder =
  mongoose.models.OrderSuborder ||
  mongoose.model<IOrderSuborder>('OrderSuborder', OrderSuborderSchema)

export default OrderSuborder

