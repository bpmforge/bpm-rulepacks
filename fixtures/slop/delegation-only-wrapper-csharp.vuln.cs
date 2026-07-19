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
        return _repo.Count();
    }
}
