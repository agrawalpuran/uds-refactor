import mongoose, { Schema, Document } from 'mongoose'

export interface IIndentHeader extends Document {
  id: string
  client_indent_number: string // Unique per company
  indent_date: Date
  companyId: string // String ID reference to Company (6-digit numeric string)
  site_id?: string // String ID reference to Location (6-digit numeric string) - Optional
  status: 'CREATED' | 'ORDERED' | 'FULFILLED' | 'CLOSED'
  created_by_user_id: string // String ID reference to Employee (6-digit numeric string)
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
      type: String,
      required: true,
      validate: {
        validator: function(v: string) {
          return /^\d{6}$/.test(v)
        },
        message: 'Company ID must be a 6-digit numeric string (e.g., "100001")'
      }
    },
    site_id: {
      type: String,
      required: false,
      validate: {
        validator: function(v: string) {
          return !v || /^\d{6}$/.test(v)
        },
        message: 'Site ID must be a 6-digit numeric string (e.g., "400001")'
      }
    },
    status: {
      type: String,
      enum: ['CREATED', 'ORDERED', 'FULFILLED', 'CLOSED'],
      default: 'CREATED',
      required: true,
      index: true,
    },
    created_by_user_id: {
      type: String,
      required: true,
      validate: {
        validator: function(v: string) {
          return /^\d{6}$/.test(v)
        },
        message: 'User ID must be a 6-digit numeric string (e.g., "300001")'
      }
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

