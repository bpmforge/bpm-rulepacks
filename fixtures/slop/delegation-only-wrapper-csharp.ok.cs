class Repository
{
    public int Count()
    {
        return 0;
    }
}

class RepositoryWrapper
{
    private readonly Repository _repo;

    public RepositoryWrapper(Repository repo)
    {
        _repo = repo;
    }

    public int Count()
    {
        int raw = _repo.Count();
        return raw < 0 ? 0 : raw;
    }
}
