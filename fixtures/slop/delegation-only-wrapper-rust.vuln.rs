struct UserRepoWrapper {
    inner: UserRepo,
}

impl UserRepoWrapper {
    fn fetch(&self) -> User {
        self.inner.fetch()
    }

    fn save(&self, item: User) -> Result<(), Error> {
        self.inner.save(item)
    }

    fn update(&mut self, id: u32, item: User) -> Result<(), Error> {
        self.inner.update(id, item)
    }
}

struct UserRepo;
struct User;
struct Error;
impl UserRepo {
    fn fetch(&self) -> User {
        User
    }
    fn save(&self, _item: User) -> Result<(), Error> {
        Ok(())
    }
    fn update(&mut self, _id: u32, _item: User) -> Result<(), Error> {
        Ok(())
    }
}
