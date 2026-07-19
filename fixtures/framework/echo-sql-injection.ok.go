package accounts

import (
	"database/sql"
	"net/http"

	"github.com/labstack/echo/v4"
)

func LookupHandler(c echo.Context, db *sql.DB) error {
	accountID := c.QueryParam("accountId")
	rows, err := db.Query("SELECT balance FROM accounts WHERE id = ?", accountID)
	if err != nil {
		return c.String(http.StatusInternalServerError, "lookup failed")
	}
	defer rows.Close()
	return c.JSON(http.StatusOK, map[string]bool{"ok": true})
}
