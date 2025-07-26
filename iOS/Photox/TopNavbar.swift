import SwiftUI
import Clerk

struct TopNavbar: View {
    @State private var isDrawerOpen = false
    @Environment(Clerk.self) private var clerk
    
    var body: some View {
        NavigationView {
            ZStack {
                // Main content view
                VStack {
                    HStack {
                        // Hamburger menu
                        Button(action: {
                            withAnimation {
                                isDrawerOpen.toggle()
                            }
                        }) {
                            Image(systemName: "line.horizontal.3")
                                .font(.title)
                        }
                        
                        Spacer()
                        
                        // Title
                        Text("PhotoX")
                            .font(.headline)
                        
                        Spacer()
                        
                        // User menu
                        Menu {
                            Button("Update User Profile", action: {
                                // Action for updating user profile
                            })
                            Button("Sign Out", action: {
                                Task {
                                    try await clerk.signOut()
                                }
                            })
                        } label: {
                            Image(systemName: "person.crop.circle")
                                .font(.title)
                        }
                    }
                    .padding()
                    .background(Color.white)
                    .shadow(radius: 2)
                    
                    ImageGeneratorView()
                    
                    Spacer()
                }
                
                // Drawer menu
                if isDrawerOpen {
                    Color.black.opacity(0.4)
                        .edgesIgnoringSafeArea(.all)
                        .onTapGesture {
                            withAnimation {
                                isDrawerOpen.toggle()
                            }
                        }
                    
                    HStack {
                        VStack(alignment: .leading) {
                            NavigationLink(destination: ImageGeneratorView()) {
                                Text("Image Generator")
                            }
                            .padding()
                            
                            Spacer()
                        }
                        .frame(width: 450)
                        .background(Color.white)
                        .offset(x: -UIScreen.main.bounds.width / 2 + 125)
                        
                        Spacer()
                    }
                }
            }
            .navigationBarHidden(true)
        }
    }
}

struct TopNavbar_Previews: PreviewProvider {
    static var previews: some View {
        TopNavbar()
    }
}
