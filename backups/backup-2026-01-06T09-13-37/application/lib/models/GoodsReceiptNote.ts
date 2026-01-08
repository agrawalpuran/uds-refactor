import mongoose, { Schema, Document } from 'mongoose'

export interface IGoodsReceiptNote extends Document {
  id: string
  vendor_indent_id: mongoose.Types.ObjectId
  vendor_id: mongoose.Types.ObjectId
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
      type: Schema.Types.ObjectId,
      ref: 'VendorIndent',
      required: true,
      index: true,
    },
    vendor_id: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true,
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

