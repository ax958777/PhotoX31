import SwiftUI
import Stripe
import StripePaymentSheet



struct CheckoutView: View {
    @StateObject var model = MyBackendModel()
    @EnvironmentObject private var subscriptionStore: SubscriptionStore
    
    var body: some View {
        VStack {
            if let paymentSheet = model.paymentSheet {
                PaymentSheet.PaymentButton(
                    paymentSheet: paymentSheet,
                    onCompletion: model.onPaymentCompletion
                ) {
                    Text("Buy")
                }
            } else {
                Text("Loading…")
            }
            if let result = model.paymentResult {
                switch result {
                case .completed:
                    Text("Payment complete")
                case .failed(let error):
                    Text("Payment failed: \(error.localizedDescription)")
                case .canceled:
                    Text("Payment canceled.")
                }
            }
        }
        .onAppear { model.preparePaymentSheet(using: subscriptionStore) }
    }
}

class MyBackendModel: ObservableObject {
    @Published var paymentSheet: PaymentSheet?
    @Published var paymentResult: PaymentSheetResult?
    
    func preparePaymentSheet(using subscriptionStore: SubscriptionStore) {
        Task {
            do {
                if let priceId = SUBSCRIPTION_PLANS.first(where: { $0.id == "pro" })?.stripePriceId {
                    let checkoutData = try await subscriptionStore.createSubscription(priceId: priceId, planName: "Pro")
                    //let checkoutData = try await subscriptionStore.createPaymentIntent(priceId: priceId, planName: "Pro", amount:SUBSCRIPTION_PLANS.first(where: { $0.id == "pro" })!.price*100)

                                        
                    //STPAPIClient.shared.publishableKey = "pk_test_51QKkq9FA8pQOwelx94fQQ4Q0pEG3wPPs5OewqsbCWskup3q7l5fjBBdijISVtcwIgX93g94fdAzmp3S6UKUtDHk60057nUxmtMΩ"
                    StripeAPI.defaultPublishableKey = checkoutData.publishableKey
                    
                    // Initialize PaymentSheet
                    var configuration = PaymentSheet.Configuration()
                    configuration.merchantDisplayName = "PhotoX"
                    //configuration.customer = .init(id: checkoutData.customer, ephemeralKeySecret: checkoutData.ephemeralKey)
                    //configuration.returnURL = "photox://stripe-redirect"
                    
                    self.paymentSheet = PaymentSheet(
                        paymentIntentClientSecret: checkoutData.clientSecret,
                        configuration: configuration
                    )
                }
            } catch {
                print("Error preparing payment sheet: \(error)")
            }
        }
    }
    
    func onPaymentCompletion(result: PaymentSheetResult) {
        self.paymentResult = result
    }
}
