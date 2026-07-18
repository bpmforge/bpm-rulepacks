import Foundation

func findUser(components: URLComponents, db: FMDatabase) {
    let name = components.queryItems?.first(where: { $0.name == "name" })?.value ?? ""
    db.executeQuery("SELECT * FROM users WHERE name = ?", withArgumentsIn: [name])
}
