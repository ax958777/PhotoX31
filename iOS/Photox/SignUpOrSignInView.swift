//
//  SignUpOrSignInView.swift
//  ClerkiOS
//
//  Created by Alex on 2025-06-22.
//

import SwiftUI

import SwiftUI

struct SignUpOrSignInView: View {
  @State private var isSignUp = false


  var body: some View {
    //ScrollView {
      if isSignUp {
        SignUpView(isSignUp : $isSignUp)
      } else {
        SignInView(isSignUp : $isSignUp)
      }

//      Button {
//        isSignUp.toggle()
//      } label: {
//        if isSignUp {
//          Text("Already have an account? Sign in")
//        } else {
//          Text("Don't have an account? Sign up")
//        }
//      }
//      .padding()
    //}
  }
}

#Preview {
    SignUpOrSignInView()
}
