package com.example.billing;

public class InvoiceService {

    /**
     * @param invoiceId the invoiceId
     */
    public Invoice findInvoice(String invoiceId) {
        return repository.find(invoiceId);
    }
}
