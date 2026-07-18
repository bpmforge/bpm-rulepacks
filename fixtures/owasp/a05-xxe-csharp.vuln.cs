using System.IO;
using System.Xml;

class XmlLoader
{
    public XmlReader LoadUntrusted(string xml)
    {
        var settings = new XmlReaderSettings();
        settings.DtdProcessing = DtdProcessing.Parse;
        return XmlReader.Create(new StringReader(xml), settings);
    }
}
