import mongoose, { Schema, Document } from 'mongoose'

export interface IPOOrder extends Document {
  purchase_order_id: mongoose.Types.ObjectId // FK to PurchaseOrder
  order_id: mongoose.Types.ObjectId // FK to Order (PR)
  createdAt?: Date
  updatedAt?: Date
}

const POOrderSchema = new Schema<IPOOrder>(
  {
    purchase_order_id: {
      type: Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
      required: true,
      index: true,
    },
    order_id: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
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

