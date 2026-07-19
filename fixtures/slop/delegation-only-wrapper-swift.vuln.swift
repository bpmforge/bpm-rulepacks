class UserServiceWrapper {
    private let dep: UserService
    init(dep: UserService) {
        self.dep = dep
    }
    func fetchUser() -> User {
        return self.dep.fetchUser()
    }
}
