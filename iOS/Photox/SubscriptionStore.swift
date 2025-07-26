import Foundation
import Supabase
import Clerk

@MainActor
class SubscriptionStore: ObservableObject {
    @Published var currentPlan: SubscriptionPlan = SUBSCRIPTION_PLANS[0]
    @Published var usageCount: Int = 0
    @Published var subscriptionStatus: SubscriptionStatus = .free
    @Published var subscriptionEnd: Date?
    @Published var isLoading: Bool = false

    enum SubscriptionStatus: String {
        case free, active, cancelled, past_due
    }

    func setCurrentPlan(plan: SubscriptionPlan) {
        self.currentPlan = plan
    }

    func incrementUsage() async {
        usageCount += 1
        // Update usage in the database
        do {
            guard let userId = Clerk.shared.user?.id else {
                print("User not authenticated")
                return
            }
            
            let formatter = ISO8601DateFormatter()
            formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            
            try await supabase.database
                .from("user_subscription")
                .update(["current_usage": "\(usageCount)", "updated_at": formatter.string(from: Date())])
                .eq("clerk_user_id", value: userId)
                .execute()
        } catch {
            print("Failed to update usage in database: \(error)")
        }
    }

    func resetUsage() {
        usageCount = 0
    }

    func setSubscriptionStatus(status: SubscriptionStatus) {
        self.subscriptionStatus = status
    }

    func setSubscriptionEnd(date: Date?) {
        self.subscriptionEnd = date
    }

    func canGenerateImage() -> Bool {
        return usageCount < currentPlan.monthlyLimit
    }

    func getRemainingGenerations() -> Int {
        return max(0, currentPlan.monthlyLimit - usageCount)
    }

    func syncWithDatabase() async {
        guard let userId = Clerk.shared.user?.id, let userEmail = Clerk.shared.user?.primaryEmailAddress else {
            print("User not authenticated for syncing subscription")
            return
        }

        print("Syncing subscription for email: \(userEmail)")

        do {
            let userSubscription: UserSubscription = try await supabase.database
                .from("user_subscription")
                .select()
                .eq("email", value: userEmail.emailAddress)
                .single()
                .execute()
                .value

            let plan = SUBSCRIPTION_PLANS.first { $0.name == userSubscription.subscription_tier } ?? SUBSCRIPTION_PLANS[0]
            
            var status: SubscriptionStatus = .free
            if userSubscription.subscription_status == "active" {
                status = .active
            } else if userSubscription.subscription_tier != nil && userSubscription.subscription_tier != "Free" {
                status = .cancelled
            }

            self.currentPlan = plan
            self.subscriptionStatus = status
            self.subscriptionEnd = userSubscription.subscription_end
            self.usageCount = userSubscription.current_usage ?? 0
            
            print("Subscription synced successfully: plan: \(plan.name), status: \(status), subscriptionEnd: \(String(describing: self.subscriptionEnd))")

        } catch {
            print("Error syncing with database, setting to free plan: \(error)")
            self.currentPlan = SUBSCRIPTION_PLANS[0]
            self.subscriptionStatus = .free
            self.subscriptionEnd = nil
        }
    }

    func checkSubscription() async {
        self.isLoading = true
        defer { self.isLoading = false }
        
        guard let token = try? await Clerk.shared.session?.getToken() else {
            print("User not authenticated for checking subscription")
            return
        }

        do {
            let response: CheckSubscriptionResponse = try await supabase.functions.invoke(
                "check-subscription",
                 options: .init(headers: ["Authorization": "Bearer \(token)"])
            )
            
            if response.subscribed, let tier = response.subscription_tier, let plan = SUBSCRIPTION_PLANS.first(where: { $0.name == tier }) {
                self.currentPlan = plan
                self.subscriptionStatus = .active
                if let endDateString = response.subscription_end {
                    let formatter = ISO8601DateFormatter()
                    self.subscriptionEnd = formatter.date(from: endDateString)
                }
                print("checkSubscription: plan: \(plan.name), status: active, subscriptionEnd: \(String(describing: self.subscriptionEnd))")
            } else {
                self.currentPlan = SUBSCRIPTION_PLANS[0]
                self.subscriptionStatus = .free
                self.subscriptionEnd = nil
            }
        } catch {
            print("Error in checkSubscription: \(error)")
        }
    }

    func createCheckoutSession(priceId: String, planName: String) async throws -> CreateCheckoutResponse {
        guard let token = try? await Clerk.shared.session?.getToken() else {
            throw URLError(.userAuthenticationRequired)
        }
        
        let body = CreateCheckoutRequest(priceId: priceId, planName: planName)
        let response: CreateCheckoutResponse = try await supabase.functions.invoke(
            "create-checkout",
            options: .init(
                headers: ["Authorization": "Bearer \(token)"],
                body: body
            )
        )
        return response
    }
    
    func createPaymentIntent(priceId: String, planName: String, amount: Double) async throws -> CreatePaymentIntentResponse {
        guard let token = try? await Clerk.shared.session?.getToken() else {
            throw URLError(.userAuthenticationRequired)
        }
        
        let body = CreatePaymentIntentRequest(priceId: priceId, planName: planName, amount: amount)
        let response: CreatePaymentIntentResponse = try await supabase.functions.invoke(
            "create-payment-intent",
            options: .init(
                headers: ["Authorization": "Bearer \(token)"],
                body: body
            )
        )
        return response
    }
    
    func createSubscription(priceId: String, planName: String) async throws -> CreateSubscriptionIntentResponse {
        guard let token = try? await Clerk.shared.session?.getToken() else {
            throw URLError(.userAuthenticationRequired)
        }
        
        let body = CreateSubscriptionIntentRequest(priceId: priceId, planName: planName)
        let response: CreateSubscriptionIntentResponse = try await supabase.functions.invoke(
            "create-subscription",
            options: .init(
                headers: ["Authorization": "Bearer \(token)"],
                body: body
            )
        )
        return response
    }

    func openCustomerPortal() async throws -> String {
        guard let token = try? await Clerk.shared.session?.getToken() else {
            throw URLError(.userAuthenticationRequired)
        }
        
        let response: CustomerPortalResponse = try await supabase.functions.invoke(
            "customer-portal",
            options: .init(headers: ["Authorization": "Bearer \(token)"])
        )
        return response.url
    }
}

struct SubscriptionPlan: Identifiable {
    let id: String
    let name: String
    let price: Double
    let monthlyLimit: Int
    let stripePriceId: String?
}

let SUBSCRIPTION_PLANS: [SubscriptionPlan] = [
    SubscriptionPlan(id: "free", name: "Free", price: 0, monthlyLimit: 5, stripePriceId: nil),
    SubscriptionPlan(id: "pro", name: "Pro", price: 10, monthlyLimit: 25, stripePriceId: "price_1Rdi4uFA8pQOwelxe6JHX3a5"),
    SubscriptionPlan(id: "pro_plus", name: "Pro Plus", price: 50, monthlyLimit: 500, stripePriceId: "price_1Rdi7HFA8pQOwelxB2on1D0R")
]

struct UserSubscription: Decodable {
    var email: String
    var subscription_tier: String?
    var subscription_status: String?
    var subscription_end: Date?
    var current_usage: Int?
}

struct CheckSubscriptionResponse: Decodable {
    let subscribed: Bool
    let subscription_tier: String?
    let subscription_end: String?
}

struct CreateCheckoutRequest: Encodable {
    let priceId: String
    let planName: String
}

struct CreatePaymentIntentRequest: Encodable {
    let priceId: String
    let planName: String
    let amount: Double
}


struct CreateCheckoutResponse: Decodable {
    let paymentIntent: String
    let ephemeralKey: String
    let customer: String
    let publishableKey: String
}

struct CustomerPortalResponse: Decodable {
    let url: String
}

struct CreatePaymentIntentResponse: Decodable {
    let client_secret: String
    let customer: String
    let publishableKey: String
}

struct CreateSubscriptionIntentRequest: Encodable {
    let priceId: String
    let planName: String
}

struct CreateSubscriptionIntentResponse: Decodable {
    let clientSecret: String
    let customer: String
    let publishableKey: String
}
