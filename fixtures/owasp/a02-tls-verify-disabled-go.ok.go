package client

import (
	"crypto/tls"
	"net/http"
)

// NewClient builds an HTTP client that pins the minimum TLS version and
// keeps full certificate validation enabled.
func NewClient() *http.Client {
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{MinVersion: tls.VersionTLS12},
	}
	return &http.Client{Transport: tr}
}
