import mongoose, { Schema, Document } from 'mongoose'

export interface IGoodsReceiptNote extends Document {
  id: string
  vendor_indent_id: string // String ID reference to VendorIndent (6-digit numeric string)
  vendor_id: string // String ID reference to Vendor (6-digit numeric string)
  grn_number: string
  grn_date: Date
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'
  remarks?: string
  createdAt?: Date
  updatedAt?: Date
}

const GoodsReceiptNoteSchema = new Schema<IGoodsReceiptNote>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    vendor_indent_id: {
      type: String,
      required: true,
      validate: {
        validator: function(v: string) {
          return /^\d{6}$/.test(v)
        },
        message: 'Vendor Indent ID must be a 6-digit numeric string'
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
    grn_number: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
      unique: true,
      index: true,
    },
    grn_date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'],
      default: 'DRAFT',
      required: true,
      index: true,
    },
    remarks: {
      type: String,
      required: false,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes for efficient queries
GoodsReceiptNoteSchema.index({ vendor_indent_id: 1 })
GoodsReceiptNoteSchema.index({ vendor_id: 1, status: 1 })

const GoodsReceiptNote =
  mongoose.models.GoodsReceiptNote ||
  mongoose.model<IGoodsReceiptNote>('GoodsReceiptNote', GoodsReceiptNoteSchema)

export default GoodsReceiptNote

