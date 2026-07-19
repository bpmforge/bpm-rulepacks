using System;
using System.Collections.Generic;

class OrderProcessor
{
    public void ProcessAll(List<string> orderIds)
    {
        foreach (var id in orderIds)
        {
            try
            {
                ProcessOrder(id);
            }
            catch (Exception e)
            {
                Console.Error.WriteLine($"order {id} failed: {e.Message}");
            }
        }
    }

    private void ProcessOrder(string id)
    {
    }
}
