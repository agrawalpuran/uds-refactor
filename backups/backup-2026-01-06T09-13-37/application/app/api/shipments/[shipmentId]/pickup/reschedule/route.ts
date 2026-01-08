import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import Shipment from '@/lib/models/Shipment'
import ShipmentPickup from '@/lib/models/ShipmentPickup'
import VendorWarehouse from '@/lib/models/VendorWarehouse'
import { createProvider } from '@/lib/providers/ProviderFactory'
import { validateAndNormalizePhone } from '@/lib/utils/phone-validation'
import { generateShippingId } from '@/lib/db/shipping-config-access'

/**
 * PUT /api/shipments/[shipmentId]/pickup/reschedule
 * Reschedule an existing pickup for an API-backed shipment
 * 
 * Eligibility Rules:
 * - shipmentMode must be 'API' (AUTOMATIC)
 * - AWB number must exist
 * - Existing pickup must exist and NOT be PICKED_UP
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  try {
    const { shipmentId } = await params
    const body = await request.json()

    await connectDB()

    // Find shipment
    const shipment = await Shipment.findOne({ shipmentId }).lean()
    if (!shipment) {
      return NextResponse.json(
        { error: `Shipment ${shipmentId} not found` },
        { status: 404 }
      )
    }

    // ====================================================
    // ELIGIBILITY VALIDATION
    // ====================================================
    
    // Rule 1: Must be API shipment (AUTOMATIC mode)
    if (shipment.shipmentMode !== 'API') {
      return NextResponse.json(
        { 
          error: 'Pickup rescheduling is only available for API-backed shipments',
          reason: 'shipmentMode is MANUAL',
        },
        { status: 400 }
      )
    }

    // Rule 2: providerShipmentReference MUST exist for API shipments
    if (!shipment.providerShipmentReference || !shipment.providerShipmentReference.trim()) {
      console.error(`[API /shipments/${shipmentId}/pickup/reschedule] ❌ CRITICAL: providerShipmentReference missing`)
      console.error(`[API /shipments/${shipmentId}/pickup/reschedule] Internal shipmentId: ${shipmentId}`)
      console.error(`[API /shipments/${shipmentId}/pickup/reschedule] Shipment mode: ${shipment.shipmentMode}`)
      return NextResponse.json(
        { 
          error: 'Provider shipment reference is missing. Cannot reschedule pickup via aggregator API.',
          reason: 'providerShipmentReference not found in shipment',
          internalShipmentId: shipmentId,
          hint: 'This shipment may have been created improperly. Please check shipment creation logs.',
        },
        { status: 400 }
      )
    }

    // Rule 3: AWB number must exist
    const awbNumber = shipment.courierAwbNumber || shipment.trackingNumber
    if (!awbNumber || !awbNumber.trim()) {
      return NextResponse.json(
        { 
          error: 'AWB number is required for pickup rescheduling',
          reason: 'AWB not found in shipment',
        },
        { status: 400 }
      )
    }

    // Rule 4: Existing pickup must exist
    const existingPickup = await ShipmentPickup.findOne({ shipmentId })
      .sort({ createdAt: -1 })
      .lean()
    
    if (!existingPickup) {
      return NextResponse.json(
        { 
          error: 'No existing pickup found. Please schedule a pickup first.',
          reason: 'pickup not found',
        },
        { status: 400 }
      )
    }

    // Rule 5: Pickup must NOT be PICKED_UP
    if (existingPickup.pickupStatus === 'PICKED_UP') {
      return NextResponse.json(
        { 
          error: 'Cannot reschedule a pickup that has already been completed',
          reason: 'pickupStatus is PICKED_UP',
        },
        { status: 400 }
      )
    }

    // Rule 6: Pickup reference ID must exist
    if (!existingPickup.pickupReferenceId) {
      return NextResponse.json(
        { 
          error: 'Pickup reference ID not found. Cannot reschedule.',
          reason: 'pickupReferenceId missing',
        },
        { status: 400 }
      )
    }

    // ====================================================
    // PHONE VALIDATION (BEFORE API CALL)
    // ====================================================
    const phoneValidation = validateAndNormalizePhone(body.contactPhone, false)
    if (!phoneValidation.isValid) {
      return NextResponse.json(
        { 
          error: phoneValidation.error || 'Invalid phone number',
          field: 'contactPhone',
        },
        { status: 400 }
      )
    }
    const normalizedPhone = phoneValidation.normalizedPhone!

    // ====================================================
    // FETCH WAREHOUSE INFORMATION
    // ====================================================
    const warehouseId = body.warehouseId || existingPickup.warehouseId
    if (!warehouseId) {
      return NextResponse.json(
        { error: 'warehouseId is required' },
        { status: 400 }
      )
    }

    const warehouse = await VendorWarehouse.findOne({ 
      warehouseRefId: warehouseId,
      vendorId: shipment.vendorId,
    }).lean()

    if (!warehouse) {
      return NextResponse.json(
        { error: `Warehouse ${warehouseId} not found` },
        { status: 404 }
      )
    }

    // ====================================================
    // CREATE PROVIDER INSTANCE
    // ====================================================
    if (!shipment.providerId) {
      return NextResponse.json(
        { error: 'Provider ID not found in shipment' },
        { status: 400 }
      )
    }

    const provider = await createProvider(
      shipment.providerId,
      undefined,
      shipment.companyShippingProviderId
    )

    if (!provider) {
      return NextResponse.json(
        { error: 'Failed to initialize shipping provider' },
        { status: 500 }
      )
    }

    // Check if provider supports pickup rescheduling
    if (!provider.reschedulePickup) {
      return NextResponse.json(
        { error: 'Pickup rescheduling is not supported by this provider' },
        { status: 400 }
      )
    }

    // ====================================================
    // BUILD PICKUP PAYLOAD
    // ====================================================
    const pickupDate = body.pickupDate ? new Date(body.pickupDate) : new Date()
    // Default to next working day if not provided
    if (!body.pickupDate) {
      pickupDate.setDate(pickupDate.getDate() + 1)
    }

    const pickupPayload = {
      awbNumber: awbNumber,
      // CRITICAL: Use providerShipmentReference (NOT internal shipmentId)
      // This is the aggregator's shipment reference (e.g., Shiprocket order_id)
      providerShipmentReference: shipment.providerShipmentReference,
      warehouseId: warehouseId,
      pickupDate: pickupDate,
      pickupTimeSlot: body.pickupTimeSlot || existingPickup.pickupTimeSlot || '10:00-13:00',
      contactName: body.contactName || existingPickup.contactName || warehouse.contactName || warehouse.warehouseName,
      contactPhone: normalizedPhone,
      warehouseAddress: {
        addressLine1: warehouse.addressLine1,
        addressLine2: warehouse.addressLine2,
        city: warehouse.city,
        state: warehouse.state,
        pincode: warehouse.pincode,
        country: 'India',
      },
    }

    // ====================================================
    // CALL PROVIDER API
    // ====================================================
    console.log(`[API /shipments/${shipmentId}/pickup/reschedule] ==========================================`)
    console.log(`[API /shipments/${shipmentId}/pickup/reschedule] Rescheduling pickup via ${provider.providerCode}`)
    console.log(`[API /shipments/${shipmentId}/pickup/reschedule] Internal shipmentId (UDS): ${shipmentId}`)
    console.log(`[API /shipments/${shipmentId}/pickup/reschedule] Provider shipment reference: ${shipment.providerShipmentReference}`)
    console.log(`[API /shipments/${shipmentId}/pickup/reschedule] ⚠️  Using providerShipmentReference for aggregator API call`)
    console.log(`[API /shipments/${shipmentId}/pickup/reschedule] ==========================================`)
    const pickupResult = await provider.reschedulePickup(
      existingPickup.pickupReferenceId!,
      pickupPayload
    )

    // ====================================================
    // CRITICAL VALIDATION: Only proceed if Shiprocket confirms success
    // ====================================================
    if (!pickupResult.success) {
      console.error(`[API /shipments/${shipmentId}/pickup/reschedule] ==========================================`)
      console.error(`[API /shipments/${shipmentId}/pickup/reschedule] ❌ PICKUP RESCHEDULING FAILED`)
      console.error(`[API /shipments/${shipmentId}/pickup/reschedule] Error:`, pickupResult.error)
      console.error(`[API /shipments/${shipmentId}/pickup/reschedule] Raw response:`, JSON.stringify(pickupResult.rawResponse, null, 2))
      console.error(`[API /shipments/${shipmentId}/pickup/reschedule] ==========================================`)
      
      // DO NOT create pickup record on failure
      // DO NOT update shipment/order status on failure
      return NextResponse.json(
        { 
          success: false,
          error: pickupResult.error || 'Failed to reschedule pickup via Shiprocket',
          details: pickupResult.rawResponse,
          message: 'Pickup was NOT rescheduled. Please check the error details and try again.',
        },
        { status: 500 }
      )
    }

    // Additional validation: Ensure pickupReferenceId exists
    if (!pickupResult.pickupReferenceId || !pickupResult.pickupReferenceId.trim()) {
      console.error(`[API /shipments/${shipmentId}/pickup/reschedule] ==========================================`)
      console.error(`[API /shipments/${shipmentId}/pickup/reschedule] ❌ VALIDATION FAILED - No pickup reference ID`)
      console.error(`[API /shipments/${shipmentId}/pickup/reschedule] Pickup result:`, JSON.stringify(pickupResult, null, 2))
      console.error(`[API /shipments/${shipmentId}/pickup/reschedule] ==========================================`)
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Pickup rescheduling failed: Shiprocket did not return a pickup reference ID. Pickup was NOT rescheduled.',
          details: pickupResult.rawResponse,
          message: 'Pickup was NOT rescheduled. Please check Shiprocket dashboard and try again.',
        },
        { status: 500 }
      )
    }

    // ====================================================
    // CREATE NEW PICKUP RECORD (ONLY after Shiprocket confirms success)
    // ====================================================
    console.log(`[API /shipments/${shipmentId}/pickup/reschedule] ==========================================`)
    console.log(`[API /shipments/${shipmentId}/pickup/reschedule] ✅ VALIDATION PASSED - Creating pickup record`)
    console.log(`[API /shipments/${shipmentId}/pickup/reschedule] Pickup Reference ID: ${pickupResult.pickupReferenceId}`)
    console.log(`[API /shipments/${shipmentId}/pickup/reschedule] ==========================================`)
    
    const pickupId = generateShippingId('PICKUP')

    const shipmentPickup = new ShipmentPickup({
      shipmentPickupId: pickupId,
      shipmentId: shipmentId,
      providerCode: provider.providerCode,
      awbNumber: awbNumber,
      pickupReferenceId: pickupResult.pickupReferenceId, // Must exist (validated above)
      pickupStatus: 'RESCHEDULED',
      pickupDate: pickupDate,
      pickupTimeSlot: pickupResult.pickupTimeSlot || body.pickupTimeSlot || existingPickup.pickupTimeSlot || '10:00-13:00',
      warehouseId: warehouseId,
      contactName: pickupPayload.contactName,
      contactPhone: normalizedPhone,
      rawProviderResponse: pickupResult.rawResponse,
    })

    await shipmentPickup.save()

    console.log(`[API /shipments/${shipmentId}/pickup/reschedule] ==========================================`)
    console.log(`[API /shipments/${shipmentId}/pickup/reschedule] ✅ PICKUP RECORD CREATED`)
    console.log(`[API /shipments/${shipmentId}/pickup/reschedule] Pickup ID: ${pickupId}`)
    console.log(`[API /shipments/${shipmentId}/pickup/reschedule] Pickup Reference ID: ${pickupResult.pickupReferenceId}`)
    console.log(`[API /shipments/${shipmentId}/pickup/reschedule] Status: RESCHEDULED`)
    console.log(`[API /shipments/${shipmentId}/pickup/reschedule] ==========================================`)

    return NextResponse.json({
      success: true,
      pickupId: pickupId,
      pickupReferenceId: pickupResult.pickupReferenceId || existingPickup.pickupReferenceId,
      pickupDate: pickupDate,
      pickupTimeSlot: pickupResult.pickupTimeSlot,
      pickupStatus: 'RESCHEDULED',
      message: pickupResult.message || 'Pickup rescheduled successfully',
    }, { status: 200 })

  } catch (error: any) {
    console.error('[API /shipments/[shipmentId]/pickup/reschedule] Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to reschedule pickup',
        type: 'api_error',
      },
      { status: 500 }
    )
  }
}

