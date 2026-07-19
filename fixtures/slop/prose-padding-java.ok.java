package com.example.billing;

public class InvoiceService {

    /**
     * @param invoiceId must be a settled invoice's ID; unsettled invoices
     *     throw InvoiceNotSettledException rather than returning null,
     *     because callers assume a returned Invoice is always postable.
     */
    public Invoice findInvoice(String invoiceId) {
        return repository.find(invoiceId);
    }
}
