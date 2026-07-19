package accounts

import (
	"database/sql"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func LookupHandler(c *gin.Context, db *sql.DB) {
	accountID := c.Query("accountId")
	query := fmt.Sprintf("SELECT balance FROM accounts WHERE id = %s", accountID)
	rows, err := db.Query(query)
	if err != nil {
		c.String(http.StatusInternalServerError, "lookup failed")
		return
	}
	defer rows.Close()
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
