package server

import "github.com/gin-gonic/gin"

func NewRouter() *gin.Engine {
	router := gin.Default()
	router.SetTrustedProxies(nil)
	router.GET("/health", func(c *gin.Context) {
		c.String(200, "ok from %s", c.ClientIP())
	})
	return router
}
