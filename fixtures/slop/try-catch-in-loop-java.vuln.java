package com.example.batch;

import java.util.List;

public class ItemImporter {

    public void importAll(List<String> items) {
        for (String item : items) {
            try {
                process(item);
            } catch (Exception e) {
                log.warn("skipping bad item: {}", item, e);
            }
        }
    }

    private void process(String item) throws Exception {
        // parse and persist
    }
}
