class UserServiceWrapper {
    private let dep: UserService
    init(dep: UserService) {
        self.dep = dep
    }
    func fetchUser(id: String) -> User {
        let raw = self.dep.fetchUser(id: id)
        logger.info("fetched user \(raw.id)")
        return normalize(raw)
    }
}
