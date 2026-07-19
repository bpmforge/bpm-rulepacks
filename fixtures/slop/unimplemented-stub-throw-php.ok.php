<?php

namespace App\Orders;

class OrderExporter
{
    public function exportToCsv(Order $order): string
    {
        $rows = [$order->getId(), $order->getTotal(), $order->getStatus()];
        return implode(',', $rows);
    }

    public function exportToPdf(Order $order): string
    {
        return $this->pdfRenderer->render($order->toArray());
    }
}
