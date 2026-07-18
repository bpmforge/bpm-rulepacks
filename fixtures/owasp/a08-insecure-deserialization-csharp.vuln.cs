using System.IO;
using System.Runtime.Serialization.Formatters.Binary;

class SessionStore
{
    public object LoadSession(Stream cookieBlob)
    {
        var formatter = new BinaryFormatter();
        return formatter.Deserialize(cookieBlob);
    }
}
