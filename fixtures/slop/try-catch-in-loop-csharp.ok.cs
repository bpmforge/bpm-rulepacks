using System;
using System.Collections.Generic;

class OrderProcessor
{
    public void ProcessAll(List<string> orderIds)
    {
        try
        {
            foreach (var id in orderIds)
            {
                ProcessOrder(id);
            }
        }
        catch (Exception e)
        {
            Console.Error.WriteLine($"batch failed: {e.Message}");
            throw;
        }
    }

    private void ProcessOrder(string id)
    {
    }
}
