import mongoose, { Schema, Document } from 'mongoose'

export interface IVendorIndent extends Document {
  id: string
  indent_id: string // String ID reference to IndentHeader (6-digit numeric string)
  vendor_id: string // String ID reference to Vendor (6-digit numeric string)
  status: 'CREATED' | 'DELIVERED' | 'GRN_SUBMITTED' | 'PAID'
  total_items: number
  total_quantity: number
  total_amount: number
  createdAt?: Date
  updatedAt?: Date
}

const VendorIndentSchema = new Schema<IVendorIndent>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    indent_id: {
      type: String,
      required: true,
      validate: {
        validator: function(v: string) {
          return /^\d{6}$/.test(v)
        },
        message: 'Indent ID must be a 6-digit numeric string'
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
    status: {
      type: String,
      enum: ['CREATED', 'DELIVERED', 'GRN_SUBMITTED', 'PAID'],
      default: 'CREATED',
      required: true,
      index: true,
    },
    total_items: {
      type: Number,
      required: true,
      default: 0,
    },
    total_quantity: {
      type: Number,
      required: true,
      default: 0,
    },
    total_amount: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

// Index for efficient queries
VendorIndentSchema.index({ indent_id: 1, vendor_id: 1 })
VendorIndentSchema.index({ vendor_id: 1, status: 1 })
VendorIndentSchema.index({ indent_id: 1, status: 1 })

const VendorIndent =
  mongoose.models.VendorIndent ||
  mongoose.model<IVendorIndent>('VendorIndent', VendorIndentSchema)

export default VendorIndent

