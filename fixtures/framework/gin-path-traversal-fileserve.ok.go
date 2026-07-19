package assets

import (
	"path/filepath"

	"github.com/gin-gonic/gin"
)

func DownloadHandler(c *gin.Context) {
	key := c.Param("filepath")
	var path string
	switch key {
	case "q1":
		path = "/srv/reports/q1-2026.pdf"
	case "q2":
		path = "/srv/reports/q2-2026.pdf"
	default:
		c.String(404, "not found")
		return
	}
	c.File(path)
}

const uploadDir = "/srv/uploads"

func UploadHandler(c *gin.Context) {
	file, err := c.FormFile("upload")
	if err != nil {
		c.String(400, "bad upload")
		return
	}
	dest := filepath.Join(uploadDir, filepath.Base(file.Filename))
	if err := c.SaveUploadedFile(file, dest); err != nil {
		c.String(500, "save failed")
		return
	}
	c.String(200, "saved")
}
