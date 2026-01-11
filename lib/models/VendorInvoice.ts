import mongoose, { Schema, Document } from 'mongoose'

export interface IVendorInvoice extends Document {
  id: string
  vendor_indent_id: string // String ID reference to VendorIndent (6-digit numeric string)
  vendor_id: string // String ID reference to Vendor (6-digit numeric string)
  invoice_number: string
  invoice_date: Date
  invoice_amount: number
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PAID' | 'REJECTED'
  createdAt?: Date
  updatedAt?: Date
}

const VendorInvoiceSchema = new Schema<IVendorInvoice>(
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
    invoice_number: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
      unique: true,
      index: true,
    },
    invoice_date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    invoice_amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'PAID', 'REJECTED'],
      default: 'DRAFT',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes for efficient queries
VendorInvoiceSchema.index({ vendor_indent_id: 1 })
VendorInvoiceSchema.index({ vendor_id: 1, status: 1 })
VendorInvoiceSchema.index({ invoice_number: 1 }, { unique: true })

const VendorInvoice =
  mongoose.models.VendorInvoice ||
  mongoose.model<IVendorInvoice>('VendorInvoice', VendorInvoiceSchema)

export default VendorInvoice

