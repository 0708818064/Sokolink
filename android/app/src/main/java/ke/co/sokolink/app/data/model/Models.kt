package ke.co.sokolink.app.data.model

import com.google.gson.annotations.SerializedName

data class Product(
    val id: String,
    val name: String,
    val slug: String,
    val price: Double,
    val discountedPrice: Double? = null,
    val stock: Int,
    val rating: Double = 5.0,
    val reviewCount: Int = 0,
    val location: String? = null,
    val images: List<ProductImage>? = null,
    val category: CategoryInfo? = null,
    val sme: SmeInfo? = null
)

data class ProductImage(
    val url: String,
    val altText: String? = null
)

data class CategoryInfo(
    val id: String? = null,
    val name: String,
    val slug: String? = null
)

data class SmeInfo(
    val id: String,
    val businessName: String,
    val businessSlug: String,
    val location: String? = null,
    val rating: Double = 5.0
)

data class User(
    val id: String,
    val name: String,
    val email: String,
    val role: String, // CUSTOMER, SME, DELIVERY, ADMIN
    val phone: String? = null
)

data class AuthResponse(
    val success: Boolean,
    val token: String? = null,
    val user: User? = null,
    val error: String? = null
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class CheckoutRequest(
    val items: List<CheckoutItemRequest>,
    val recipientName: String,
    val phone: String,
    val county: String,
    val subCounty: String,
    val estateOrStreet: String,
    val landmark: String? = null,
    val notes: String? = null,
    val deliveryOption: String = "STANDARD",
    val paymentMethod: String = "MPESA"
)

data class CheckoutItemRequest(
    val productId: String,
    val quantity: Int
)

data class CheckoutResponse(
    val success: Boolean,
    val order: OrderSummary? = null,
    val error: String? = null
)

data class OrderSummary(
    val id: String,
    val orderNumber: String,
    val trackingToken: String,
    val total: Double,
    val status: String
)

data class TrackingResponse(
    val order: TrackingOrderDetails? = null
)

data class TrackingOrderDetails(
    val id: String,
    val orderNumber: String,
    val trackingToken: String,
    val status: String,
    val paymentStatus: String,
    val total: Double,
    val verificationCode: String? = null,
    val deliveryTasks: List<DeliveryTaskInfo>? = null
)

data class DeliveryTaskInfo(
    val id: String,
    val deliveryReference: String,
    val status: String,
    val pickupAddress: String,
    val dropoffAddress: String,
    val riderName: String? = null,
    val riderPhone: String? = null,
    val vehiclePlate: String? = null
)

data class CourierTask(
    val id: String,
    val deliveryReference: String,
    val recipientName: String,
    val recipientPhone: String,
    val pickupAddress: String,
    val dropoffAddress: String,
    val fee: Double,
    val status: String,
    val verificationCode: String? = null
)

data class VerifyOtpRequest(
    val deliveryId: String,
    val otpCode: String
)

data class VerifyOtpResponse(
    val success: Boolean,
    val message: String? = null,
    val error: String? = null
)

data class StkPushRequest(
    val orderId: String,
    val phone: String
)

data class StkPushResponse(
    val success: Boolean,
    val CheckoutRequestID: String? = null,
    val ResponseDescription: String? = null,
    val error: String? = null
)
