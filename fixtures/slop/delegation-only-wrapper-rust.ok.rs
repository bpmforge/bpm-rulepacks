struct UserRepoWrapper {
    inner: UserRepo,
}

impl UserRepoWrapper {
    fn fetch(&self) -> User {
        let raw = self.inner.fetch();
        raw.normalize()
    }

    fn save(&self, item: User) -> Result<(), Error> {
        if item.is_valid() {
            self.inner.save(item)
        } else {
            Err(Error)
        }
    }

    fn fetch_cached(&self) -> User {
        self.inner.fetch_all()
    }
}

struct UserRepo;
struct User;
struct Error;
impl User {
    fn normalize(self) -> User {
        self
    }
    fn is_valid(&self) -> bool {
        true
    }
}
impl UserRepo {
    fn fetch(&self) -> User {
        User
    }
    fn fetch_all(&self) -> User {
        User
    }
    fn save(&self, _item: User) -> Result<(), Error> {
        Ok(())
    }
}
