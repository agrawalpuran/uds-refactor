# How to Create a New Product Category

## Overview
The system supports dynamic product categories. You can create custom categories for your company in addition to the default system categories (Shirt, Pant, Shoe, Jacket, Accessory).

## Method 1: Using the API (Recommended for Programmatic Access)

### API Endpoint
```
POST /api/categories
```

### Request Body
```json
{
  "companyId": "100001",  // Your company ID (required)
  "name": "T-Shirt",      // Category name (required)
  "renewalUnit": "months" // Optional: "months" or "years" (default: "months")
}
```

### Example using cURL
```bash
curl -X POST http://localhost:3001/api/categories \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "100001",
    "name": "T-Shirt",
    "renewalUnit": "months"
  }'
```

### Example using JavaScript/Fetch
```javascript
const response = await fetch('/api/categories', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    companyId: '100001',
    name: 'T-Shirt',
    renewalUnit: 'months'
  })
})

const data = await response.json()
console.log('Category created:', data.category)
```

## Method 2: Using a Script

Create a script file `scripts/create-category.js`:

```javascript
const { MongoClient, ObjectId } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uniform-distribution'

async function createCategory() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    const db = client.db()
    
    // Replace with your company ID
    const companyId = '100001' // Your company ID
    const categoryName = 'T-Shirt' // Category name
    const renewalUnit = 'months' // 'months' or 'years'
    
    // Find company
    const company = await db.collection('companies').findOne({
      $or: [
        { id: companyId },
        { _id: new ObjectId(companyId) }
      ]
    })
    
    if (!company) {
      console.error('Company not found')
      return
    }
    
    // Check if category exists
    const existing = await db.collection('productcategories').findOne({
      companyId: company._id,
      name: { $regex: new RegExp(`^${categoryName}$`, 'i') }
    })
    
    if (existing) {
      console.error('Category already exists')
      return
    }
    
    // Generate unique ID
    let categoryId = 500001
    while (await db.collection('productcategories').findOne({ id: categoryId.toString() })) {
      categoryId++
    }
    
    // Create category
    const category = {
      id: categoryId.toString(),
      name: categoryName.trim(),
      companyId: company._id,
      renewalUnit: renewalUnit === 'years' ? 'years' : 'months',
      isSystemCategory: false,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    await db.collection('productcategories').insertOne(category)
    
    console.log('✅ Category created successfully!')
    console.log(`   ID: ${category.id}`)
    console.log(`   Name: ${category.name}`)
    console.log(`   Company: ${company.name}`)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

createCategory()
```

Run it:
```bash
node scripts/create-category.js
```

## Method 3: Direct Database Insert (Not Recommended)

You can also insert directly into MongoDB, but this bypasses validation:

```javascript
// Using MongoDB shell or MongoDB Compass
db.productcategories.insertOne({
  id: "500001",
  name: "T-Shirt",
  companyId: ObjectId("..."), // Your company ObjectId
  renewalUnit: "months",
  isSystemCategory: false,
  status: "active",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

## Important Notes

1. **Company ID**: You need your company's numeric ID (e.g., "100001") or ObjectId
2. **Unique Names**: Category names must be unique per company (case-insensitive)
3. **System Categories**: Default categories (Shirt, Pant, Shoe, Jacket, Accessory) are automatically created and cannot be deleted
4. **Renewal Unit**: Determines if eligibility cycles are measured in months or years
5. **Status**: Categories can be set to "active" or "inactive" (soft delete)

## After Creating a Category

1. **Assign to Products**: When creating/editing products, you can now select the new category
2. **Set Eligibility**: Add the category to designation eligibility rules
3. **Use in Orders**: Products with the new category will be available for ordering

## Example Categories You Might Create

- T-Shirt
- Trouser
- Belt
- Cap
- Socks
- Tie
- Blazer
- Waistcoat
- Custom Category Name

## Troubleshooting

- **"Category already exists"**: A category with that name already exists for your company
- **"Company not found"**: Check that your companyId is correct
- **Category not showing**: Ensure `status: "active"` and refresh the page

