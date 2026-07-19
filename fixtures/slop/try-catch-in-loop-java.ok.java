package com.example.batch;

import java.util.List;

public class ItemImporter {

    public void importAll(List<String> items) {
        try {
            for (String item : items) {
                process(item);
            }
        } catch (Exception e) {
            log.warn("import batch failed", e);
            throw new ImportException("batch import failed", e);
        }
    }

    private void process(String item) throws Exception {
        // parse and persist
    }
}
