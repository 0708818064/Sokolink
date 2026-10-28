package ke.co.sokolink.app.data.api

import ke.co.sokolink.app.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface SokoLinkApiService {

    // Authentication
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>

    // Product Catalogue
    @GET("products")
    suspend fun getProducts(
        @Query("search") search: String? = null,
        @Query("category") category: String? = null
    ): Response<Map<String, Any>>

    @GET("products/{id}")
    suspend fun getProductDetail(@Path("id") id: String): Response<Product>

    // Checkout & Order Placement
    @POST("checkout")
    suspend fun createOrder(@Body request: CheckoutRequest): Response<CheckoutResponse>

    // Daraja M-Pesa STK Push Trigger
    @POST("payments/mpesa/stkpush")
    suspend fun triggerStkPush(@Body request: StkPushRequest): Response<StkPushResponse>

    // Real-Time Milestone Tracking with 6-digit OTP
    @GET("orders/track/{token}")
    suspend fun trackOrder(@Path("token") token: String): Response<TrackingResponse>

    // Courier Tasks & Handover OTP Check
    @GET("delivery")
    suspend fun getCourierTasks(): Response<Map<String, Any>>

    @POST("delivery/verify-otp")
    suspend fun verifyDeliveryOtp(@Body request: VerifyOtpRequest): Response<VerifyOtpResponse>
}
