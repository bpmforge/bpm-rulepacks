using System;
using System.IO;

class ConfigLoader
{
    public string LoadConfig(string path)
    {
        try
        {
            return File.ReadAllText(path);
        }
        catch (IOException e)
        {
            Console.Error.WriteLine($"failed to load config {path}: {e.Message}");
            throw;
        }
    }
}
