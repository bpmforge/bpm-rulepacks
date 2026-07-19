package server

import "github.com/gin-gonic/gin"

func NewRouter() *gin.Engine {
	router := gin.Default()
	router.SetTrustedProxies([]string{"10.0.0.0/8", "172.16.0.0/12"})
	router.GET("/health", func(c *gin.Context) {
		c.String(200, "ok from %s", c.ClientIP())
	})
	return router
}
