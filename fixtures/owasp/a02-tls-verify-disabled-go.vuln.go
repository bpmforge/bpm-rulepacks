package client

import (
	"crypto/tls"
	"net/http"
)

// NewClient builds an HTTP client that skips TLS certificate validation
// entirely, "temporarily", to work around a certificate error.
func NewClient() *http.Client {
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	return &http.Client{Transport: tr}
}
