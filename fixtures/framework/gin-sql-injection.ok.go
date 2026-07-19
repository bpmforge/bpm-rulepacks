package accounts

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
)

func LookupHandler(c *gin.Context, db *sql.DB) {
	accountID := c.Query("accountId")
	rows, err := db.Query("SELECT balance FROM accounts WHERE id = ?", accountID)
	if err != nil {
		c.String(http.StatusInternalServerError, "lookup failed")
		return
	}
	defer rows.Close()
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
