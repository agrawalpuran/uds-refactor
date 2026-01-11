import mongoose, { Schema, Document } from 'mongoose'

export interface IPayment extends Document {
  id: string
  invoice_id: string // String ID reference to VendorInvoice (6-digit numeric string)
  vendor_id: string // String ID reference to Vendor (6-digit numeric string)
  payment_reference: string
  payment_date: Date
  amount_paid: number
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  createdAt?: Date
  updatedAt?: Date
}

const PaymentSchema = new Schema<IPayment>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    invoice_id: {
      type: String,
      required: true,
      validate: {
        validator: function(v: string) {
          return /^\d{6}$/.test(v)
        },
        message: 'Invoice ID must be a 6-digit numeric string'
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
    payment_reference: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      unique: true,
      index: true,
    },
    payment_date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    amount_paid: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'],
      default: 'PENDING',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes for efficient queries
PaymentSchema.index({ invoice_id: 1 })
PaymentSchema.index({ vendor_id: 1, status: 1 })
PaymentSchema.index({ payment_reference: 1 }, { unique: true })

const Payment =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema)

export default Payment

