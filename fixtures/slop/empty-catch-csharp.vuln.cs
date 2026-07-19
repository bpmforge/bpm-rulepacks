using System;
using System.IO;

class ConfigLoader
{
    public string LoadConfig(string path)
    {
        string data = null;
        try
        {
            data = File.ReadAllText(path);
        }
        catch (IOException e)
        {
        }
        return data;
    }
}
