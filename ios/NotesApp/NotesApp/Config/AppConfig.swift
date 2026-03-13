import Foundation

enum AppConfig {
    static let apiBaseURL: String = {
        guard let url = Bundle.main.infoDictionary?["API_BASE_URL"] as? String else {
            return "http://localhost:3001/api"
        }
        return url
    }()
}
