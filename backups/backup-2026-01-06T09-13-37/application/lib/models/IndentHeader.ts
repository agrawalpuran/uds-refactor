import mongoose, { Schema, Document } from 'mongoose'

export interface IIndentHeader extends Document {
  id: string
  client_indent_number: string // Unique per company
  indent_date: Date
  companyId: mongoose.Types.ObjectId
  site_id?: mongoose.Types.ObjectId // Optional site reference
  status: 'CREATED' | 'ORDERED' | 'FULFILLED' | 'CLOSED'
  created_by_user_id: mongoose.Types.ObjectId
  created_by_role: 'COMPANY_ADMIN' | 'SITE_ADMIN' | 'EMPLOYEE'
  createdAt?: Date
  updatedAt?: Date
}

const IndentHeaderSchema = new Schema<IIndentHeader>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    client_indent_number: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    indent_date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    site_id: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
      required: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['CREATED', 'ORDERED', 'FULFILLED', 'CLOSED'],
      default: 'CREATED',
      required: true,
      index: true,
    },
    created_by_user_id: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    created_by_role: {
      type: String,
      enum: ['COMPANY_ADMIN', 'SITE_ADMIN', 'EMPLOYEE'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

// Ensure client_indent_number is unique per company
IndentHeaderSchema.index({ companyId: 1, client_indent_number: 1 }, { unique: true })
// Index for efficient status queries
IndentHeaderSchema.index({ companyId: 1, status: 1 })
IndentHeaderSchema.index({ created_by_user_id: 1, status: 1 })

const IndentHeader =
  mongoose.models.IndentHeader ||
  mongoose.model<IIndentHeader>('IndentHeader', IndentHeaderSchema)

export default IndentHeader

