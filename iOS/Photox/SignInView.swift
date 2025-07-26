//
//  SignInView.swift
//  ClerkiOS
//
//  Created by Alex on 2025-06-22.
//

import SwiftUI
import Clerk

struct SigninView: View {
    @State private var email = ""
    @State private var password = ""
    
    var body: some View {
        VStack {
            Text("Sign In")
            TextField("Email", text: $email)
            SecureField("Password", text: $password)
            Button("Continue") {
                //Task { await submit(email: email, password: password) }
            }
        }
        .padding()
    }
}

extension SignInView {
    
    func submit(email: String, password: String) async {
        do {
            isSigningIn = true
            try await SignIn.create(
                strategy: .identifier(email, password: password)
            )
            await subscriptionStore.syncWithDatabase()
            isSigningIn = false
        } catch {
            dump(error)
            isSigningIn = false
        }
    }
    
    func submitWithApple() async {
        do {
            isSigningIn = true
            // Use the Clerk SignInWithAppleHelper class to get your Apple credential
            let credential = try await SignInWithAppleHelper.getAppleIdCredential()
            
            // Convert the identityToken data to String format
            guard let idToken = credential.identityToken.flatMap({ String(data: $0, encoding: .utf8) }) else { return }
            
            // Authenticate with Clerk
            try await SignIn.authenticateWithIdToken(provider: .apple, idToken: idToken)
            await subscriptionStore.syncWithDatabase()
            isSigningIn = false
        } catch {
            dump(error)
            isSigningIn = false
        }
    }
    
    func submitWithGoogle() async {
        do {
            isSigningIn = true
            try await SignIn.authenticateWithRedirect(strategy: .oauth(provider: .google))
            await subscriptionStore.syncWithDatabase()
            isSigningIn = false
        } catch {
            dump(error)
            isSigningIn = false
        }
    }

}

struct SignInView: View {
    @Binding var isSignUp: Bool
    @EnvironmentObject private var subscriptionStore: SubscriptionStore
    
    @State private var email = ""
    @State private var password = ""
    @State private var isPasswordVisible = false
    @State private var isSigningIn = false
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // Background
                backgroundView
                
                // Floating decorative elements
                floatingElements
                
                // Main content
                VStack(spacing: 0) {
                    Spacer()
                    
                    // Main form container
                    VStack(spacing: 32) {
                        headerView
                        formFieldsView
                        signinButtonView
                        dividerView
                        socialMediaButtonView
                        footerView
                    }
                    .padding(.horizontal, 32)
                    .padding(.vertical, 40)
                    .background(
                        RoundedRectangle(cornerRadius: 24)
                            .fill(Color.black.opacity(0.3))
                            .background(.ultraThinMaterial)
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 24)
                            .stroke(Color.white.opacity(0.1), lineWidth: 1)
                    )
                    .padding(.horizontal, 24)
                    
                    Spacer()
                }
            }
        }
        .ignoresSafeArea()
    }
    
    // MARK: - Background View
    private var backgroundView: some View {
        LinearGradient(
            colors: [
                Color(red: 0.98, green: 0.95, blue: 0.9),
                Color(red: 0.99, green: 0.92, blue: 0.87),
                Color(red: 0.99, green: 0.87, blue: 0.85)
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
        .overlay(
            // Subtle texture overlay
            Rectangle()
                .fill(Color.black.opacity(0.05))
                .blendMode(.multiply)
        )
    }
    
    // MARK: - Floating Elements
    private var floatingElements: some View {
        ZStack {
            Circle()
                .fill(Color.white.opacity(0.1))
                .frame(width: 32, height: 32)
                .blur(radius: 2)
                .offset(x: 140, y: -300)
            
            Circle()
                .fill(Color.orange.opacity(0.2))
                .frame(width: 48, height: 48)
                .blur(radius: 4)
                .offset(x: -160, y: 200)
            
            Circle()
                .fill(Color.amber.opacity(0.3))
                .frame(width: 24, height: 24)
                .blur(radius: 2)
                .offset(x: -120, y: -100)
        }
    }
    // MARK: - Divider View
    private var dividerView: some View {
        HStack {
            Rectangle()
                .fill(Color.white.opacity(0.2))
                .frame(height: 1)
            
            Text("or")
                .font(.subheadline)
                .foregroundColor(.white.opacity(0.5))
                .padding(.horizontal, 16)
            
            Rectangle()
                .fill(Color.white.opacity(0.2))
                .frame(height: 1)
        }
    }
    
    // MARK: - Header View
    private var headerView: some View {
        VStack(spacing: 8) {
            Text("Sign In")
                .font(.largeTitle)
                .fontWeight(.light)
                .foregroundColor(.white)
            
            Text("Signin your account to get started")
                .font(.subheadline)
                .foregroundColor(.white.opacity(0.7))
        }
    }
    
    // MARK: - Form Fields View
    private var formFieldsView: some View {
        VStack(spacing: 24) {
        
                // Email Field
                CustomTextField(
                    text: $email,
                    placeholder: "Email",
                    isSecure: false
                )
                
                
                // Password Field
                HStack {
                    CustomTextField(
                        text: $password,
                        placeholder: "Password",
                        isSecure: !isPasswordVisible
                    )
                    
                    Button(action: {
                        isPasswordVisible.toggle()
                    }) {
                        Image(systemName: isPasswordVisible ? "eye.slash" : "eye")
                            .foregroundColor(.white.opacity(0.5))
                            .frame(width: 20, height: 20)
                    }
                    .padding(.trailing, 16)
                }
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.white.opacity(0.2), lineWidth: 1)
                )
            
        }
    }
    
    // MARK: - Signup Button View
    private var signinButtonView: some View {
        Button(action: {
            //handleSignup()
            Task { await submit(email: email, password: password) }
        }) {
            HStack {
                if isSigningIn {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .black))
                        .scaleEffect(0.8)
                } else {
                    Text("Sign In")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(.black)
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(Color.white)
            .cornerRadius(16)
        }
        .disabled(isSigningIn)
        .scaleEffect(isSigningIn ? 0.95 : 1.0)
        .animation(.easeInOut(duration: 0.1), value: isSigningIn)
    }
    
    
    // MARK: - Social Media Button View
    private var socialMediaButtonView: some View {
        VStack(spacing: 16) {
                    // Apple/Social Media Accounts Button
                    Button(action: {
                        // Handle Apple signin
                        Task { await submitWithApple() }
                    }) {
                        HStack(spacing: 12) {
                            Image(systemName: "applelogo")
                                .font(.system(size: 16))
                                .foregroundColor(.white)
                            
                            Text("Sign in with Apple")
                                .font(.system(size: 16))
                                .foregroundColor(.white)
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(Color.gray.opacity(0.4))
                        )
                    }
                    
                    // Google Sign In Button
                    Button(action: {
                        // Handle Google sign in
                        Task { await submitWithGoogle() }
                    }) {
                        HStack(spacing: 12) {
                            // Google logo placeholder using SF Symbol
                            Image(systemName: "globe")
                                .font(.system(size: 16))
                                .foregroundColor(.white)
                            
                            Text("Sign in with Google")
                                .font(.system(size: 16))
                                .foregroundColor(.white)
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(Color.gray.opacity(0.4))
                        )
                    }
                }
    }
    
    // MARK: - Footer View
    private var footerView: some View {
        HStack {
            Text("Don't have an account?")
                .font(.subheadline)
                .foregroundColor(.white.opacity(0.5))
            
            Button("Sign Up") {
                // Handle sign in navigation
                isSignUp=true
            }
            .font(.subheadline)
            .foregroundColor(.white)
        }
    }
    
}





// MARK: - Preview
struct SignInView_Previews: PreviewProvider {
    static var previews: some View {
        SignInView(isSignUp: .constant(false))
    }
}
