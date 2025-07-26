//
//  SignUpView.swift
//  ClerkiOS
//
//  Created by Alex on 2025-06-22.
//

import SwiftUI
import Clerk

struct SignupView: View {
  @State private var email = ""
  @State private var password = ""
  @State private var code = ""
  @State private var isVerifying = false

  var body: some View {
    VStack {
      Text("Sign Up")
      if isVerifying {
        TextField("Code", text: $code)
        Button("Verify") {
          Task { await verify(code: code) }
        }
      } else {
        TextField("Email", text: $email)
        SecureField("Password", text: $password)
        Button("Continue") {
          Task { await signUp(email: email, password: password) }
        }
      }
    }
    .padding()
  }
}

extension SignupView {

  func signUp(email: String, password: String) async {
    do {
      let signUp = try await SignUp.create(
        strategy: .standard(emailAddress: email, password: password)
      )

      try await signUp.prepareVerification(strategy: .emailCode)

      isVerifying = true
    } catch {
      dump(error)
    }
  }

  func verify(code: String) async {
    do {
      guard let signUp = Clerk.shared.client?.signUp else {
        isVerifying = false
        return
      }

      try await signUp.attemptVerification(strategy: .emailCode(code: code))
    } catch {
      dump(error)
    }
  }

}

struct SignUpView: View {
    @Binding var isSignUp: Bool
    @EnvironmentObject private var subscriptionStore: SubscriptionStore
    
    @State private var email = ""
    @State private var code = ""
    @State private var isVerifying = false
    @State private var isVerifyForm = false
    @State private var password = ""
    @State private var isPasswordVisible = false
    @State private var isSigningUp = false
    
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
                        if isVerifyForm  {
                            verifyButtonView
                        }else{
                            signupButtonView
                        }
                        
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
    
    // MARK: - Header View
    private var headerView: some View {
        VStack(spacing: 8) {
            Text("Welcome")
                .font(.largeTitle)
                .fontWeight(.light)
                .foregroundColor(.white)
            
            Text("Create your account to get started")
                .font(.subheadline)
                .foregroundColor(.white.opacity(0.7))
        }
    }
    
    // MARK: - Form Fields View
    private var formFieldsView: some View {
        VStack(spacing: 24) {
            if isVerifyForm  {
                // Code
                CustomTextField(
                    text: $code,
                    placeholder: "Code",
                    isSecure: false
                )
                
            }else {
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
    }
    
    // MARK: - Signup Button View
    private var signupButtonView: some View {
        Button(action: {
            //handleSignup()
            Task { await signUp(email: email, password: password) }
        }) {
            HStack {
                if isSigningUp {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .black))
                        .scaleEffect(0.8)
                } else {
                    Text("Sign Up")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(.black)
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(Color.white)
            .cornerRadius(16)
        }
        .disabled(isSigningUp)
        .scaleEffect(isSigningUp ? 0.95 : 1.0)
        .animation(.easeInOut(duration: 0.1), value: isSigningUp)
    }
    
    // MARK: - Signup Button View
    private var verifyButtonView: some View {
        Button(action: {
            Task { await verify(code: code) }
        }) {
            HStack {
                if isSigningUp {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .black))
                        .scaleEffect(0.8)
                } else {
                    Text("Verify")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(.black)
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(Color.white)
            .cornerRadius(16)
        }
        .disabled(isSigningUp)
        .scaleEffect(isSigningUp ? 0.95 : 1.0)
        .animation(.easeInOut(duration: 0.1), value: isSigningUp)
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
    
    // MARK: - Social Media Button View
    private var socialMediaButtonView: some View {
        Button(action: {
            // Handle social media signup
        }) {
            HStack(spacing: 12) {
                Image(systemName: "applelogo")
                    .font(.system(size: 16))
                    .foregroundColor(.white)
                
                Text("Social Media Accounts")
                    .font(.system(size: 16))
                    .foregroundColor(.white)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(Color.white.opacity(0.1))
            .background(.ultraThinMaterial)
            .cornerRadius(16)
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color.white.opacity(0.2), lineWidth: 1)
            )
        }
    }
    
    // MARK: - Footer View
    private var footerView: some View {
        HStack {
            Text("Already have an account?")
                .font(.subheadline)
                .foregroundColor(.white.opacity(0.5))
            
            Button("Sign In") {
                // Handle sign in navigation
                isSignUp=false
            }
            .font(.subheadline)
            .foregroundColor(.white)
        }
    }
    
    // MARK: - Actions
    private func handleSignup() {
        isSigningUp = true
        
        // Simulate API call
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            isSigningUp = false
            // Handle signup result
        }
    }
}

extension SignUpView {

  func signUp(email: String, password: String) async {
    do {
      isSigningUp = true
      let signUp = try await SignUp.create(
        strategy: .standard(emailAddress: email, password: password)
      )

      try await signUp.prepareVerification(strategy: .emailCode)

      isSigningUp = false
      isVerifyForm = true
    } catch {
      isSigningUp = false
      dump(error)
    }
  }

  func verify(code: String) async {
    do {
      guard let signUp = Clerk.shared.client?.signUp else {
        isVerifying = false
        return
      }

      try await signUp.attemptVerification(strategy: .emailCode(code: code))
      await subscriptionStore.syncWithDatabase()
    } catch {
      dump(error)
    }
  }

}
// MARK: - Custom TextField
struct CustomTextField: View {
    @Binding var text: String
    let placeholder: String
    let isSecure: Bool
    @FocusState private var isFocused: Bool
    
    var body: some View {
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.gray.opacity(0.4))
                    .frame(height: 56)
                
                HStack {
                    ZStack(alignment: .leading) {
                        if text.isEmpty {
                            Text(placeholder)
                                .foregroundColor(.white.opacity(0.7))
                                .font(.system(size: 16))
                        }
                        
                        Group {
                            if isSecure {
                                SecureField("", text: $text)
                            } else {
                                TextField("", text: $text)
                            }
                        }
                        .focused($isFocused)
                        .font(.system(size: 16))
                        .foregroundColor(.white)
                    }
                    Spacer()
                }
                .padding(.horizontal, 16)
            }
            .animation(.easeInOut(duration: 0.2), value: isFocused)
        }
}

// MARK: - Color Extensions
extension Color {
    static let amber = Color(red: 1.0, green: 0.75, blue: 0.0)
}

// MARK: - Preview
struct SignUpView_Previews: PreviewProvider {
    static var previews: some View {
        
        SignUpView(isSignUp: .constant(false))
    }
}
