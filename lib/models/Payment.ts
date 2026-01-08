import mongoose, { Schema, Document } from 'mongoose'

export interface IPayment extends Document {
  id: string
  invoice_id: mongoose.Types.ObjectId
  vendor_id: mongoose.Types.ObjectId
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
      type: Schema.Types.ObjectId,
      ref: 'VendorInvoice',
      required: true,
      index: true,
    },
    vendor_id: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true,
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

