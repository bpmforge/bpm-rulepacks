package assets

import "github.com/gin-gonic/gin"

func DownloadHandler(c *gin.Context) {
	c.File(c.Param("filepath"))
}

func UploadHandler(c *gin.Context) {
	file, err := c.FormFile("upload")
	if err != nil {
		c.String(400, "bad upload")
		return
	}
	dest := c.PostForm("destination")
	if err := c.SaveUploadedFile(file, dest); err != nil {
		c.String(500, "save failed")
		return
	}
	c.String(200, "saved")
}
