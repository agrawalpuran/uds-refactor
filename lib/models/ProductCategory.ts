import mongoose, { Schema, Document } from 'mongoose'

export interface IProductCategory extends Document {
  id: string // Unique 6-digit ID (e.g., "500001")
  name: string // Category name (e.g., "Shirt", "Trouser", "Shoe", "Custom Category")
  companyId: string // String ID reference to Company (6-digit numeric string)
  renewalUnit: 'months' | 'years' // Default renewal unit for this category
  isSystemCategory?: boolean // True for system categories (shirt, pant, shoe, jacket, accessory)
  status: 'active' | 'inactive'
  createdAt?: Date
  updatedAt?: Date
}

const ProductCategorySchema = new Schema<IProductCategory>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function(v: string) {
          // Must be exactly 6 digits
          return /^\d{6}$/.test(v)
        },
        message: 'Product Category ID must be a 6-digit numeric string (e.g., "500001")'
      }
    },
    name: {
      type: String,
      required: true,
      trim: true,
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
    renewalUnit: {
      type: String,
      enum: ['months', 'years'],
      default: 'months',
      required: true,
    },
    isSystemCategory: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes for efficient queries
ProductCategorySchema.index({ companyId: 1, status: 1 })
ProductCategorySchema.index({ companyId: 1, name: 1 }, { unique: true }) // Unique category name per company

const ProductCategory = mongoose.models.ProductCategory || 
  mongoose.model<IProductCategory>('ProductCategory', ProductCategorySchema)

export default ProductCategory

