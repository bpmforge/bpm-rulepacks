<?php

namespace App\Orders;

class OrderExporter
{
    public function exportToCsv(Order $order): string
    {
        throw new \Exception('not implemented');
    }

    public function exportToPdf(Order $order): string
    {
        throw new \RuntimeException('TODO: implement PDF export');
    }
}
