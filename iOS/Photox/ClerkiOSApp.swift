//
//  ClerkiOSApp.swift
//  ClerkiOS
//
//  Created by Alex on 2025-06-22.
//

import SwiftUI
import Clerk
import Supabase
import Stripe

@main
struct ClerkiOSApp: App {
    @State private var clerk = Clerk.shared
    @State private var supabaseClient = supabase
    @StateObject private var subscriptionStore = SubscriptionStore()

    var body: some Scene {
        WindowGroup {
          ZStack {
            if clerk.isLoaded {
              ContentView()
            } else {
              ProgressView()
            }
          }
          .environment(clerk)
          .environmentObject(subscriptionStore)
          .onOpenURL { url in
              let stripeHandled = StripeAPI.handleURLCallback(with: url)
              if !stripeHandled {
                  //clerk.handleRedirect(for: url)
              }
          }
          .task {
              // Initialize Clerk with your publishable key
              if let path = Bundle.main.path(forResource: "ClerkConfig", ofType: "plist"),
                 let plist = NSDictionary(contentsOfFile: path),
                 let publishableKey = plist["CLERK_PUBLISHABLE_KEY"] as? String {
                  clerk.configure(publishableKey: publishableKey)
              }
            try? await clerk.load()
          }
        }
      }
    }
