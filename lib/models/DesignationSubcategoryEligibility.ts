/**
 * DesignationSubcategoryEligibility Model - COMPANY-SPECIFIC
 * 
 * Defines eligibility at the subcategory level (not category level).
 * Each designation can have different eligibility for different subcategories.
 * 
 * Example:
 *   Designation: "General Manager"
 *   Company A:
 *     - "Managers Full Shirt" subcategory: 6 items, 6 months
 *     - "Managers Half Shirt" subcategory: 4 items, 6 months
 *   Company B:
 *     - "Executive Shirt" subcategory: 8 items, 12 months
 */

import mongoose, { Schema, Document } from 'mongoose'

export interface IDesignationSubcategoryEligibility extends Document {
  id: string // Unique 6-digit ID (e.g., "700001")
  designationId: string // Designation name (e.g., "General Manager", "Office Admin")
  subCategoryId: mongoose.Types.ObjectId // Reference to Subcategory (REQUIRED)
  companyId: mongoose.Types.ObjectId // Reference to Company (REQUIRED)
  gender?: 'male' | 'female' | 'unisex' // Gender filter (optional)
  quantity: number // Number of items allowed per cycle
  renewalFrequency: number // Renewal frequency value
  renewalUnit: 'months' | 'years' // Renewal unit
  status: 'active' | 'inactive'
  createdAt?: Date
  updatedAt?: Date
}

const DesignationSubcategoryEligibilitySchema = new Schema<IDesignationSubcategoryEligibility>(
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
        message: 'Designation Subcategory Eligibility ID must be a 6-digit numeric string (e.g., "700001")'
      }
    },
    designationId: {
      type: String,
      required: true,
      trim: true,
    },
    subCategoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Subcategory',
      required: true,
      index: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'unisex'],
      default: 'unisex',
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    renewalFrequency: {
      type: Number,
      required: true,
      min: 1,
    },
    renewalUnit: {
      type: String,
      enum: ['months', 'years'],
      required: true,
      default: 'months',
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
DesignationSubcategoryEligibilitySchema.index({ companyId: 1, designationId: 1, status: 1 })
DesignationSubcategoryEligibilitySchema.index({ companyId: 1, subCategoryId: 1, status: 1 })
DesignationSubcategoryEligibilitySchema.index({ companyId: 1, designationId: 1, gender: 1, status: 1 })

// Unique constraint: Same designation cannot have duplicate eligibility for same subcategory, company, and gender
DesignationSubcategoryEligibilitySchema.index(
  { designationId: 1, subCategoryId: 1, companyId: 1, gender: 1 },
  { unique: true }
)

// Validation: Ensure subcategory belongs to the same company
DesignationSubcategoryEligibilitySchema.pre('save', async function(next) {
  if (this.isModified('subCategoryId') || this.isModified('companyId') || this.isNew) {
    const Subcategory = mongoose.model('Subcategory')
    const subcategory = await Subcategory.findById(this.subCategoryId)
    
    if (!subcategory) {
      return next(new Error(`Subcategory with ID ${this.subCategoryId} not found`))
    }
    
    // CRITICAL SECURITY: Ensure subcategory belongs to the same company
    if (subcategory.companyId.toString() !== this.companyId.toString()) {
      return next(new Error(`Subcategory "${subcategory.name}" does not belong to company ${this.companyId}`))
    }
    
    if (subcategory.status !== 'active') {
      return next(new Error(`Subcategory "${subcategory.name}" is not active`))
    }
  }
  
  next()
})

const DesignationSubcategoryEligibility = mongoose.models.DesignationSubcategoryEligibility || 
  mongoose.model<IDesignationSubcategoryEligibility>('DesignationSubcategoryEligibility', DesignationSubcategoryEligibilitySchema)

export default DesignationSubcategoryEligibility

