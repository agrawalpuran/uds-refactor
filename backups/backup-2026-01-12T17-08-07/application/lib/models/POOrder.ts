import mongoose, { Schema, Document } from 'mongoose'

export interface IPOOrder extends Document {
  purchase_order_id: string // String ID reference to PurchaseOrder (6-digit numeric string)
  order_id: string // String ID reference to Order (6-digit numeric string)
  createdAt?: Date
  updatedAt?: Date
}

const POOrderSchema = new Schema<IPOOrder>(
  {
    purchase_order_id: {
      type: String,
      required: true,
      validate: {
        validator: function(v: string) {
          return /^\d{6}$/.test(v)
        },
        message: 'Purchase Order ID must be a 6-digit numeric string'
      }
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
  },
  {
    timestamps: true,
  }
)

// Compound index for unique constraint: one order can only be in one PO
POOrderSchema.index({ purchase_order_id: 1, order_id: 1 }, { unique: true })
// Reverse index for querying all POs for a given order
POOrderSchema.index({ order_id: 1, purchase_order_id: 1 })

const POOrder = mongoose.models.POOrder || mongoose.model<IPOOrder>('POOrder', POOrderSchema)

export default POOrder

