using System;
using System.IO;

class ConfigReader
{
    public string ReadConfig(string path)
    {
        try
        {
            return File.ReadAllText(path);
        }
        catch (IOException e)
        {
            throw new ConfigLoadException($"failed to read config {path}", e);
        }
    }
}

class ConfigLoadException : Exception
{
    public ConfigLoadException(string message, Exception inner) : base(message, inner) { }
}
