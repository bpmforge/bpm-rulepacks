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
            return null;
        }
    }
}
