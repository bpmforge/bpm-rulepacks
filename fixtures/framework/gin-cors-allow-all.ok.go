package server

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func NewRouter() *gin.Engine {
	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"https://app.example.com", "https://admin.example.com"},
		AllowCredentials: true,
		AllowMethods:     []string{"GET", "POST"},
	}))
	return router
}
