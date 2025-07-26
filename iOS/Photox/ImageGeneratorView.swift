import SwiftUI
import PhotosUI
import Clerk

struct ImageGeneratorView: View {
    @State private var selectedTab = 0
    
    // Generate states
    @State private var prompt = ""
    @State private var selectedStyle: StyleOption = .none
    @State private var aspectRatio: AspectRatioOption = .square
    @State private var cameraProximity: PhotographyOption = .none
    @State private var cameraPosition: PhotographyOption = .none
    @State private var lighting: PhotographyOption = .none
    @State private var cameraSettings: PhotographyOption = .none
    @State private var lensType: PhotographyOption = .none
    @State private var filmType: PhotographyOption = .none
    @State private var generalQuality: QualityOption = .none
    @State private var photoQuality: QualityOption = .none
    @State private var artQuality: QualityOption = .none
    @State private var backgroundTransparent = false
    @State private var isGenerating = false
    @State private var generatedImageURL: URL?
    
    // Edit states
    @State private var editPrompt = ""
    @State private var isEditing = false
    @State private var editedImageURL: URL?
    @State private var selectedImage: PhotosPickerItem?
    @State private var uploadedImage: Image?
    @State private var uploadedImageData: Data?
    @State private var showCheckout = false
    
    @Environment(Clerk.self) private var clerk
    @EnvironmentObject private var subscriptionStore: SubscriptionStore
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    Text("AI Image Generator")
                        .font(.largeTitle).fontWeight(.bold)
                    
                    Text("Create and edit amazing images with the power of Gemini AI")
                        .font(.headline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                    
                    Text("Remaining Generations: \(subscriptionStore.getRemainingGenerations())")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    
                    Picker("Mode", selection: $selectedTab) {
                        Text("Generate").tag(0)
                        Text("Edit").tag(1)
                    }
                    .pickerStyle(.segmented)
                    
                    if selectedTab == 0 {
                        generateView
                    } else {
                        editView
                    }
                    
                    if !subscriptionStore.canGenerateImage() {
                        Button("Subscribe for More Generations") {
                            showCheckout = true
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(.green)
                    }
                    
                    Button("Manage Subscription") {
                        Task {
                            do {
                                let urlString = try await subscriptionStore.openCustomerPortal()
                                if let url = URL(string: urlString) {
                                    // openURL(url) // This will be handled differently now
                                }
                            } catch {
                                print("Error opening customer portal: \(error)")
                            }
                        }
                    }
                    .buttonStyle(.bordered)
                }
                .padding()
            }
            .task {
                await subscriptionStore.syncWithDatabase()
            }
            .sheet(isPresented: $showCheckout) {
                CheckoutView()
            }
            .navigationTitle("Image Generator")
            .navigationBarHidden(true)
        }
    }
    
    var generateView: some View {
        VStack(spacing: 20) {
            // Generated Image Display
            CardView(title: "Generated Image") {
                if isGenerating {
                    ProgressView()
                        .frame(height: 300)
                } else if let url = generatedImageURL {
                    AsyncImage(url: url) { image in
                        image.resizable().scaledToFit()
                    } placeholder: {
                        ProgressView()
                    }
                    .frame(height: 300)
                    Button(action: { saveImage(from: url) }) {
                        Label("Download Image", systemImage: "square.and.arrow.down")
                    }
                    .buttonStyle(.bordered)
                    .padding(.top)
                } else {
                    VStack {
                        Image(systemName: "photo.on.rectangle.angled")
                            .font(.largeTitle)
                            .padding()
                        Text("Generated image will appear here")
                            .foregroundStyle(.secondary)
                    }
                    .frame(height: 300)
                }
            }
            
            // Generation Controls
            CardView(title: "Generate New Image") {
                VStack(alignment: .leading, spacing: 15) {
                    Text("Describe the image you want to create").font(.headline)
                    TextEditor(text: $prompt)
                        .frame(height: 100)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color.gray.opacity(0.5), lineWidth: 1)
                        )
                    
                    Picker("Art Style", selection: $selectedStyle) {
                        ForEach(styleOptions) { option in
                            Text(option.label).tag(option)
                        }
                    }
                    
                    Picker("Aspect Ratio", selection: $aspectRatio) {
                        ForEach(aspectRatioOptions) { option in
                            Text(option.label).tag(option)
                        }
                    }
                    
                    if selectedStyle == .photograph {
                        DisclosureGroup("Photography Options") {
                            photographyOptionsView
                        }
                    }
                    
                    DisclosureGroup("Quality Modifiers") {
                        qualityModifiersView
                    }
                    
                    DisclosureGroup("Background Options") {
                        Toggle("Transparent Background", isOn: $backgroundTransparent)
                    }
                    
                    Button(action: generateImage) {
                        if isGenerating {
                            ProgressView()
                                .progressViewStyle(.circular)
                                .tint(.white)
                        } else {
                            Label("Generate with Gemini AI", systemImage: "wand.and.stars")
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .frame(maxWidth: .infinity)
                    .disabled(isGenerating || prompt.isEmpty || !subscriptionStore.canGenerateImage())
                }
            }
        }
    }
    
    var editView: some View {
        VStack(spacing: 20) {
            CardView(title: "Edited Image") {
                if isEditing {
                    ProgressView()
                        .frame(height: 300)
                } else if let url = editedImageURL {
                    AsyncImage(url: url) { image in
                        image.resizable().scaledToFit()
                    } placeholder: {
                        ProgressView()
                    }
                    .frame(height: 300)
                    Button(action: { saveImage(from: url) }) {
                        Label("Download Image", systemImage: "square.and.arrow.down")
                    }
                    .buttonStyle(.bordered)
                    .padding(.top)
                } else {
                    VStack {
                        Image(systemName: "photo.on.rectangle.angled")
                            .font(.largeTitle)
                            .padding()
                        Text("Edited image will appear here")
                            .foregroundStyle(.secondary)
                    }
                    .frame(height: 300)
                }
            }
            
            CardView(title: "Edit Existing Image") {
                VStack(alignment: .leading, spacing: 15) {
                    PhotosPicker(
                        selection: $selectedImage,
                        matching: .images,
                        photoLibrary: .shared()
                    ) {
                        Label("Upload Image to Edit", systemImage: "square.and.arrow.up")
                    }
                    .onChange(of: selectedImage) { newItem in
                        Task {
                            if let data = try? await newItem?.loadTransferable(type: Data.self) {
                                uploadedImageData = data
                                if let uiImage = UIImage(data: data) {
                                    uploadedImage = Image(uiImage: uiImage)
                                }
                            }
                        }
                    }
                    
                    if let image = uploadedImage {
                        image
                            .resizable()
                            .scaledToFit()
                            .frame(maxHeight: 200)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                        
                        Text("Describe the changes you want").font(.headline)
                        TextEditor(text: $editPrompt)
                            .frame(height: 100)
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(Color.gray.opacity(0.5), lineWidth: 1)
                            )
                        
                        Button(action: editImage) {
                            if isEditing {
                                ProgressView().tint(.white)
                            } else {
                                Label("Edit with Gemini AI", systemImage: "pencil.and.scribble")
                            }
                        }
                        .buttonStyle(.borderedProminent)
                        .frame(maxWidth: .infinity)
                        .disabled(isEditing || editPrompt.isEmpty || !subscriptionStore.canGenerateImage())
                    }
                }
            }
        }
    }
    
    var photographyOptionsView: some View {
        VStack {
            Picker("Proximity", selection: $cameraProximity) {
                ForEach(photographyProximityOptions) { Text($0.label).tag($0) }
            }
            Picker("Position", selection: $cameraPosition) {
                ForEach(photographyPositionOptions) { Text($0.label).tag($0) }
            }
            Picker("Lighting", selection: $lighting) {
                ForEach(photographyLightingOptions) { Text($0.label).tag($0) }
            }
            Picker("Settings", selection: $cameraSettings) {
                ForEach(photographySettingsOptions) { Text($0.label).tag($0) }
            }
            Picker("Lens", selection: $lensType) {
                ForEach(photographyLensOptions) { Text($0.label).tag($0) }
            }
            Picker("Film", selection: $filmType) {
                ForEach(photographyFilmOptions) { Text($0.label).tag($0) }
            }
        }.pickerStyle(.menu)
    }
    
    var qualityModifiersView: some View {
        VStack {
            Picker("General Quality", selection: $generalQuality) {
                ForEach(qualityGeneralOptions) { Text($0.label).tag($0) }
            }
            if selectedStyle == .photograph {
                Picker("Photo Quality", selection: $photoQuality) {
                    ForEach(qualityPhotoOptions) { Text($0.label).tag($0) }
                }
            }
            if selectedStyle.isArt {
                Picker("Art Quality", selection: $artQuality) {
                    ForEach(qualityArtOptions) { Text($0.label).tag($0) }
                }
            }
        }.pickerStyle(.menu)
    }
    
    func generateImage() {
        Task {
            guard let token = try? await clerk.session?.getToken() else {
                print("Not authenticated")
                return
            }
            
            isGenerating = true
            defer { isGenerating = false }
            
            var finalPrompt = prompt
            
            if selectedStyle != .none {
                finalPrompt += ", in \(selectedStyle.label) style"
                if selectedStyle == .photograph {
                    let photoTerms = [cameraProximity, cameraPosition, lighting, cameraSettings, lensType, filmType]
                        .filter { $0 != .none }
                        .map { $0.label.lowercased() }
                    if !photoTerms.isEmpty {
                        finalPrompt += ", \(photoTerms.joined(separator: ", "))"
                    }
                }
            }
            
            var qualityTerms: [String] = []
            if generalQuality != .none { qualityTerms.append(generalQuality.label.lowercased()) }
            if selectedStyle == .photograph && photoQuality != .none { qualityTerms.append(photoQuality.label.lowercased()) }
            if selectedStyle.isArt && artQuality != .none { qualityTerms.append(artQuality.label.lowercased()) }
            
            if !qualityTerms.isEmpty {
                finalPrompt += ", \(qualityTerms.joined(separator: ", "))"
            }
            
            if backgroundTransparent {
                finalPrompt += ", transparent background, no background, isolated subject"
            }
            
            let requestBody = GenerateImageRequest(
                prompt: finalPrompt,
                type: "generated",
                aspectRatio: aspectRatio.value,
                width: aspectRatio.width,
                height: aspectRatio.height
            )
            
            do {
                let result: GenerateImageResponse = try await supabase.functions
                    .invoke("generate-image",
                            options: .init(
                                headers: ["Authorization": "Bearer \(token)"],
                                body: requestBody
                            )
                    )
                generatedImageURL = URL(string: result.imageUrl)
                await subscriptionStore.incrementUsage()
            } catch {
                print("Error generating image: \(error)")
            }
        }
    }
    
    func editImage() {
        Task {
            guard let token = try? await clerk.session?.getToken(), let imageData = uploadedImageData else {
                print("Not authenticated or no image data")
                return
            }
            
            isEditing = true
            defer { isEditing = false }
            
            let imageBase64 = imageData.base64EncodedString()
            let mimeType = "image/jpeg" // Or derive from data if possible
            
            let requestBody = EditImageRequest(
                prompt: editPrompt,
                type: "edited",
                imageData: imageBase64,
                mimeType: mimeType
            )
            
            do {
                let result: GenerateImageResponse = try await supabase.functions
                    .invoke("generate-image",
                            options: .init(
                                headers: ["Authorization": "Bearer \(token)"],
                                body: requestBody
                            )
                    )
                editedImageURL = URL(string: result.imageUrl)
                await subscriptionStore.incrementUsage()
            } catch {
                print("Error editing image: \(error)")
            }
        }
    }
    
    func saveImage(from url: URL) {
        URLSession.shared.dataTask(with: url) { data, _, error in
            guard let data = data, let image = UIImage(data: data), error == nil else { return }
            UIImageWriteToSavedPhotosAlbum(image, nil, nil, nil)
        }.resume()
    }
}

struct CardView<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content
    
    var body: some View {
        VStack(alignment: .leading) {
            Text(title)
                .font(.title2)
                .fontWeight(.semibold)
            
            VStack {
                content
            }
            .padding()
            .frame(maxWidth: .infinity)
            .background(Color(.secondarySystemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }
}

struct GenerateImageResponse: Decodable {
    let imageUrl: String
}

fileprivate struct GenerateImageRequest: Encodable {
    let prompt: String
    let type: String
    let aspectRatio: String
    let width: Int
    let height: Int
}

fileprivate struct EditImageRequest: Encodable {
    let prompt: String
    let type: String
    let imageData: String
    let mimeType: String
}

// MARK: - Data Models

protocol LabeledOption: Identifiable, Hashable {
    var id: String { get }
    var value: String { get }
    var label: String { get }
}

extension LabeledOption {
    var id: String { value }
}

struct StyleOption: LabeledOption {
    let value: String
    let label: String
    var isArt: Bool = false
    
    static let none = StyleOption(value: "none", label: "Default")
    static let painting = StyleOption(value: "painting", label: "Painting", isArt: true)
    static let photograph = StyleOption(value: "photograph", label: "Photograph")
    static let sketch = StyleOption(value: "sketch", label: "Sketch", isArt: true)
    static let digitalArt = StyleOption(value: "digital-art", label: "Digital Art", isArt: true)
    static let watercolor = StyleOption(value: "watercolor", label: "Watercolor", isArt: true)
    static let oilPainting = StyleOption(value: "oil-painting", label: "Oil Painting", isArt: true)
    static let pastel = StyleOption(value: "pastel", label: "Pastel Painting", isArt: true)
    static let charcoal = StyleOption(value: "charcoal", label: "Charcoal Drawing", isArt: true)
    static let pencil = StyleOption(value: "pencil", label: "Pencil Drawing", isArt: true)
    static let ink = StyleOption(value: "ink", label: "Ink Drawing", isArt: true)
}

let styleOptions: [StyleOption] = [
    .none, .painting, .photograph, .sketch, .digitalArt, .watercolor, .oilPainting, .pastel, .charcoal, .pencil, .ink,
    StyleOption(value: "cartoon", label: "Cartoon"),
    StyleOption(value: "anime", label: "Anime"),
    StyleOption(value: "realistic", label: "Photorealistic"),
    StyleOption(value: "abstract", label: "Abstract"),
    StyleOption(value: "minimalist", label: "Minimalist"),
    StyleOption(value: "vintage", label: "Vintage"),
    StyleOption(value: "isometric", label: "Isometric 3D"),
    StyleOption(value: "pixel-art", label: "Pixel Art"),
    StyleOption(value: "pop-art", label: "Pop Art"),
]

struct AspectRatioOption: LabeledOption {
    let value: String
    let label: String
    let width: Int
    let height: Int
    
    static let square = AspectRatioOption(value: "1:1", label: "Square (1:1)", width: 1024, height: 1024)
}

let aspectRatioOptions: [AspectRatioOption] = [
    .square,
    AspectRatioOption(value: "4:3", label: "Fullscreen (4:3)", width: 1024, height: 768),
    AspectRatioOption(value: "3:4", label: "Portrait (3:4)", width: 768, height: 1024),
    AspectRatioOption(value: "16:9", label: "Widescreen (16:9)", width: 1024, height: 576),
    AspectRatioOption(value: "9:16", label: "Portrait (9:16)", width: 576, height: 1024),
]

struct PhotographyOption: LabeledOption {
    let value: String
    let label: String
    static let none = PhotographyOption(value: "none", label: "Default")
}

let photographyProximityOptions: [PhotographyOption] = [.none, .init(value: "close-up", label: "Close up"), .init(value: "far-away", label: "Far away")]
let photographyPositionOptions: [PhotographyOption] = [.none, .init(value: "aerial", label: "Aerial"), .init(value: "from-below", label: "From below"), .init(value: "eye-level", label: "Eye level")]
let photographyLightingOptions: [PhotographyOption] = [.none, .init(value: "natural", label: "Natural"), .init(value: "dramatic", label: "Dramatic"), .init(value: "warm", label: "Warm"), .init(value: "cold", label: "Cold")]
let photographySettingsOptions: [PhotographyOption] = [.none, .init(value: "motion-blur", label: "Motion blur"), .init(value: "soft-focus", label: "Soft focus"), .init(value: "bokeh", label: "Bokeh")]
let photographyLensOptions: [PhotographyOption] = [.none, .init(value: "35mm", label: "35mm"), .init(value: "50mm", label: "50mm"), .init(value: "fisheye", label: "Fisheye")]
let photographyFilmOptions: [PhotographyOption] = [.none, .init(value: "black-and-white", label: "Black and white"), .init(value: "polaroid", label: "Polaroid"), .init(value: "sepia", label: "Sepia")]

struct QualityOption: LabeledOption {
    let value: String
    let label: String
    static let none = QualityOption(value: "none", label: "Default")
}

let qualityGeneralOptions: [QualityOption] = [.none, .init(value: "high-quality", label: "High-quality"), .init(value: "beautiful", label: "Beautiful")]
let qualityPhotoOptions: [QualityOption] = [.none, .init(value: "4k", label: "4K"), .init(value: "hdr", label: "HDR")]
let qualityArtOptions: [QualityOption] = [.none, .init(value: "professional", label: "By a professional"), .init(value: "detailed", label: "Detailed")]


struct ImageGeneratorView_Previews: PreviewProvider {
    static var previews: some View {
        ImageGeneratorView()
            .environment(Clerk.shared)
            .environmentObject(SubscriptionStore())
    }
}
