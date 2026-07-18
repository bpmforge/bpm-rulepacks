import Foundation

func findUser(components: URLComponents, db: FMDatabase) {
    let name = components.queryItems?.first(where: { $0.name == "name" })?.value ?? ""
    let query = "SELECT * FROM users WHERE name = '\(name)'"
    db.executeQuery(query, withArgumentsIn: [])
}
